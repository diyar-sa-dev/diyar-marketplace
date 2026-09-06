<?php

namespace App\Services\Identity;

use App\Contracts\Identity\OtpCodeGenerator;
use App\Enums\OtpPurpose;
use App\Infrastructure\Mail\LogEmailOtpProvider;
use App\Services\Mail\DiyarMailContent;
use App\Services\Mail\DiyarPhpMailer;
use App\Support\Identity\OtpTestCodeResolver;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

final class EmailOtpService
{
    public function __construct(
        private readonly OtpCodeGenerator $codeGenerator,
        private readonly EmailOtpCacheStore $cache,
        private readonly DiyarPhpMailer $mailer,
        private readonly DiyarMailContent $mailContent,
    ) {}

    /**
     * @param  array<string, mixed>  $metadata
     */
    public function issue(
        string $email,
        OtpPurpose $purpose,
        ?string $userId = null,
        string $recipientName = '',
        string $locale = 'ar',
        array $metadata = [],
        int $resendCount = 0,
    ): void {
        $normalizedEmail = $this->normalizeEmail($email);
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
            'metadata' => $metadata,
        ];

        $this->cache->put($normalizedEmail, $purpose, $payload, $ttlSeconds);

        $title = $locale === 'ar' ? 'تحقق من بريدك الإلكتروني' : 'Verify your email';
        $subject = $locale === 'ar'
            ? 'رمز التحقق — ديار'
            : 'Verification code — Diyar';

        $body = $this->mailContent->otpVerificationBody(
            $locale,
            $recipientName !== '' ? $recipientName : ($locale === 'ar' ? 'عزيزي المستخدم' : 'there'),
            $code,
            $expiresMinutes,
        );

        $this->mailer->send(
            $normalizedEmail,
            $subject,
            $locale,
            $title,
            $body,
        );

        LogEmailOtpProvider::exposeForDevelopment($normalizedEmail, $purpose, $code);
    }

    public function resend(string $email, OtpPurpose $purpose, string $recipientName = '', string $locale = 'ar'): void
    {
        $normalizedEmail = $this->normalizeEmail($email);
        $active = $this->cache->get($normalizedEmail, $purpose);

        if ($active === null) {
            throw ValidationException::withMessages([
                'email' => [__('diyar.otp.invalid_request')],
            ]);
        }

        $cooldown = (int) config('diyar.otp.resend_cooldown_seconds', 60);
        $lastSentAt = (int) ($active['last_sent_at'] ?? 0);
        if ($lastSentAt > 0 && now()->timestamp < ($lastSentAt + $cooldown)) {
            throw ValidationException::withMessages([
                'email' => [__('diyar.otp.cooldown')],
            ]);
        }

        $maxResends = (int) config('diyar.otp.max_resends_per_hour', 5);
        if ((int) ($active['resend_count'] ?? 0) >= $maxResends) {
            throw ValidationException::withMessages([
                'email' => [__('diyar.otp.too_many_resends')],
            ]);
        }

        $this->issue(
            email: $normalizedEmail,
            purpose: $purpose,
            userId: $active['user_id'] ?? null,
            recipientName: $recipientName,
            locale: $locale,
            metadata: is_array($active['metadata'] ?? null) ? $active['metadata'] : [],
            resendCount: ((int) ($active['resend_count'] ?? 0)) + 1,
        );
    }

    public function assertValid(string $email, OtpPurpose $purpose, string $code): void
    {
        $this->validateCode($email, $purpose, $code);
    }

    /**
     * @return array<string, mixed>
     */
    public function verify(string $email, OtpPurpose $purpose, string $code): array
    {
        $state = $this->validateCode($email, $purpose, $code);
        $this->cache->forget($this->normalizeEmail($email), $purpose);

        return $state;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function peek(string $email, OtpPurpose $purpose): ?array
    {
        return $this->cache->get($this->normalizeEmail($email), $purpose);
    }

    /**
     * @return array<string, mixed>
     */
    private function validateCode(string $email, OtpPurpose $purpose, string $code): array
    {
        $normalizedEmail = $this->normalizeEmail($email);
        $state = $this->cache->get($normalizedEmail, $purpose);

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
            $this->cache->update($normalizedEmail, $purpose, $state, $expiresMinutes * 60);

            throw ValidationException::withMessages([
                'code' => [__('diyar.otp.invalid')],
            ]);
        }

        return $state;
    }

    private function normalizeEmail(string $email): string
    {
        return strtolower(trim($email));
    }
}
