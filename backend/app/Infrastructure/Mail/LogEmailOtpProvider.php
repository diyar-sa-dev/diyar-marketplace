<?php

namespace App\Infrastructure\Mail;

use App\Enums\OtpPurpose;
use Illuminate\Support\Facades\Log;

/**
 * Development helper — logs plain email OTP codes when mail is disabled or in testing.
 */
final class LogEmailOtpProvider
{
    /** @var list<array{email: string, purpose: string, otp: string}> */
    public static array $developmentOtps = [];

    public static function exposeForDevelopment(
        string $email,
        OtpPurpose $purpose,
        string $otp,
    ): void {
        if (! self::shouldExposePlainOtp()) {
            return;
        }

        self::$developmentOtps[] = [
            'email' => strtolower(trim($email)),
            'purpose' => $purpose->value,
            'otp' => $otp,
        ];

        Log::info('Email OTP issued for development testing', [
            'email' => strtolower(trim($email)),
            'purpose' => $purpose->value,
            'otp' => $otp,
        ]);
    }

    public static function shouldExposePlainOtp(): bool
    {
        if (app()->environment('production')) {
            return false;
        }

        if (! app()->environment(['local', 'testing'])) {
            return false;
        }

        if (config('diyar.mail.enabled', false)) {
            return false;
        }

        return true;
    }

    public static function flush(): void
    {
        self::$developmentOtps = [];
    }

    /**
     * @return array{email: string, purpose: string, otp: string}|null
     */
    public static function lastDevelopmentOtp(): ?array
    {
        if (self::$developmentOtps === []) {
            return null;
        }

        return self::$developmentOtps[array_key_last(self::$developmentOtps)];
    }
}
