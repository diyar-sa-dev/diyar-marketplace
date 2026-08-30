<?php

namespace App\Services\Identity;

use App\Contracts\Identity\OtpCodeGenerator;
use App\Contracts\Sms\SmsProvider;
use App\Enums\OtpPurpose;
use App\Infrastructure\Sms\LogSmsProvider;
use App\Support\Identity\OtpTestCodeResolver;
use Illuminate\Support\Facades\Hash;
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
        $code = OtpTestCodeResolver::resolve($length, $this->codeGenerator);
        $expiresMinutes = (int) config('diyar.otp.expires_minutes', 10);
        $ttlSeconds = $expiresMinutes * 60;

        $payload = [
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'resend_count' => $resendCount,
            'last_sent_at' => now()->timestamp,
            'user_id' => $userId,
            'provider_ref' => null,
            'metadata' => $metadata,
        ];

        $this->cache->put($phone, $purpose, $payload, $ttlSeconds);

        $message = __('diyar.otp_message', [
            'code' => $code,
            'minutes' => $expiresMinutes,
        ]);

        $this->sms->send($phone, $message);

        LogSmsProvider::exposeForDevelopment($phone, $purpose, $code);
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
        $state = $this->validateCode($phone, $purpose, $code);
        $this->cache->forget($phone, $purpose);

        return $state;
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

        if (! Hash::check($code, (string) $state['code_hash'])) {
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
     * @return array<string, mixed>|null
     */
    public function peek(string $phone, OtpPurpose $purpose): ?array
    {
        return $this->cache->get($phone, $purpose);
    }
}
