<?php

namespace App\Services\Identity;

use App\Contracts\Identity\OtpCodeGenerator;
use App\Contracts\Sms\SmsProvider;
use App\Enums\OtpPurpose;
use App\Infrastructure\Sms\LogSmsProvider;
use App\Support\Identity\OtpTestCodeResolver;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

final class OtpService
{
    public function __construct(
        private readonly SmsProvider $sms,
        private readonly OtpCodeGenerator $codeGenerator,
        private readonly OtpCacheStore $cache,
    ) {}

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function issue(
        string $phone,
        OtpPurpose $purpose,
        ?string $userId = null,
        array $metadata = [],
        int $resendCount = 0,
    ): void {
        $length = (int) config('diyar.otp.length', 6);
        $smsCode = $this->codeGenerator->generate($length);
        $testCode = OtpTestCodeResolver::testCodeOrNull($length);
        $expiresMinutes = (int) config('diyar.otp.expires_minutes', 10);
        $ttlSeconds = $expiresMinutes * 60;

        $payload = [
            'code_hash' => Hash::make($smsCode),
            'attempts' => 0,
            'resend_count' => $resendCount,
            'last_sent_at' => now()->timestamp,
            'user_id' => $userId,
            'provider_ref' => null,
            'metadata' => $metadata,
        ];

        if ($testCode !== null && $testCode !== $smsCode) {
            $payload['test_code_hash'] = Hash::make($testCode);
        }

        $this->cache->put($phone, $purpose, $payload, $ttlSeconds);

        $message = __('diyar.otp_message', [
            'code' => $smsCode,
            'minutes' => $expiresMinutes,
        ]);

        try {
            $this->sms->send($phone, $message);
        } catch (\Throwable $exception) {
            $this->cache->forget($phone, $purpose);

            Log::warning('otp.delivery.failed', [
                'purpose' => $purpose->value,
                'channel' => 'sms',
                'error' => $exception->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'code' => [__('diyar.otp.delivery_failed')],
            ]);
        }

        $this->logIssuedCodes($phone, $purpose, $smsCode, $testCode, $userId);
    }

    public function resend(string $phone, OtpPurpose $purpose): void
    {
        $active = $this->cache->get($phone, $purpose);

        if ($active === null) {
            throw ValidationException::withMessages([
                'phone' => [__('diyar.otp.invalid_request')],
            ]);
        }

        $cooldown = (int) config('diyar.otp.resend_cooldown_seconds', 60);
        $lastSentAt = (int) ($active['last_sent_at'] ?? 0);
        if ($lastSentAt > 0 && now()->timestamp < ($lastSentAt + $cooldown)) {
            throw ValidationException::withMessages([
                'phone' => [__('diyar.otp.cooldown')],
            ]);
        }

        $maxResends = (int) config('diyar.otp.max_resends_per_hour', 5);
        if ((int) ($active['resend_count'] ?? 0) >= $maxResends) {
            throw ValidationException::withMessages([
                'phone' => [__('diyar.otp.too_many_resends')],
            ]);
        }

        $this->issue(
            phone: $phone,
            purpose: $purpose,
            userId: $active['user_id'] ?? null,
            metadata: is_array($active['metadata'] ?? null) ? $active['metadata'] : [],
            resendCount: ((int) ($active['resend_count'] ?? 0)) + 1,
        );
    }

    /**
     * Validate an OTP without consuming it (for multi-step flows).
     */
    public function assertValid(string $phone, OtpPurpose $purpose, string $code): void
    {
        $this->validateCode($phone, $purpose, $code);
    }

    /**
     * @return array<string, mixed>
     */
    public function verify(string $phone, OtpPurpose $purpose, string $code): array
    {
        $lock = Cache::lock($this->cache->key($phone, $purpose).':verify', 10);

        try {
            $lock->block(5);

            $state = $this->validateCode($phone, $purpose, $code);
            $this->cache->forget($phone, $purpose);

            Log::info('otp.verify.success', [
                'purpose' => $purpose->value,
                'channel' => 'sms',
                'user_id' => $state['user_id'] ?? null,
            ]);

            return $state;
        } finally {
            optional($lock)->release();
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function validateCode(string $phone, OtpPurpose $purpose, string $code): array
    {
        $state = $this->cache->get($phone, $purpose);

        if ($state === null) {
            throw ValidationException::withMessages([
                'code' => [__('diyar.otp.expired')],
            ]);
        }

        $maxAttempts = (int) config('diyar.otp.max_attempts', 5);
        if ((int) ($state['attempts'] ?? 0) >= $maxAttempts) {
            throw ValidationException::withMessages([
                'code' => [__('diyar.otp.too_many_attempts')],
            ]);
        }

        if (! $this->codesMatch($code, $state)) {
            $state['attempts'] = ((int) ($state['attempts'] ?? 0)) + 1;
            $expiresMinutes = (int) config('diyar.otp.expires_minutes', 10);
            $this->cache->update($phone, $purpose, $state, $expiresMinutes * 60);

            throw ValidationException::withMessages([
                'code' => [__('diyar.otp.invalid')],
            ]);
        }

        return $state;
    }

    /**
     * @param  array<string, mixed>  $state
     */
    private function codesMatch(string $code, array $state): bool
    {
        if (Hash::check($code, (string) $state['code_hash'])) {
            return true;
        }

        $testHash = $state['test_code_hash'] ?? null;

        return is_string($testHash)
            && $testHash !== ''
            && Hash::check($code, $testHash);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function peek(string $phone, OtpPurpose $purpose): ?array
    {
        return $this->cache->get($phone, $purpose);
    }

    private function logIssuedCodes(
        string $phone,
        OtpPurpose $purpose,
        string $smsCode,
        ?string $testCode,
        ?string $userId,
    ): void {
        Log::info('otp.sent', [
            'purpose' => $purpose->value,
            'channel' => 'sms',
            'user_id' => $userId,
        ]);

        if (! LogSmsProvider::shouldExposePlainOtp()) {
            return;
        }

        Log::info('otp.delivery', [
            'phone' => $phone,
            'purpose' => $purpose->value,
            'sms_code' => $smsCode,
            'user_id' => $userId,
        ]);

        if ($testCode !== null && $testCode !== $smsCode) {
            Log::info('otp.test_code', [
                'phone' => $phone,
                'purpose' => $purpose->value,
                'test_code' => $testCode,
                'user_id' => $userId,
            ]);
        }

        LogSmsProvider::exposeForDevelopment($phone, $purpose, $smsCode);
    }
}
