<?php

namespace App\Infrastructure\Sms;

use App\Contracts\Sms\SmsProvider;
use App\Enums\OtpPurpose;
use Illuminate\Support\Facades\Log;

/**
 * Local/test SMS provider — stores messages in memory for assertions.
 *
 * In local/testing (without MSEGAT credentials), plain OTP values are written to
 * application logs to support manual auth testing. Production never exposes OTPs.
 */
final class LogSmsProvider implements SmsProvider
{
    /** @var list<array{phone: string, message: string}> */
    public static array $messages = [];

    /** @var list<array{phone: string, purpose: string, otp: string}> */
    public static array $developmentOtps = [];

    public function send(string $phone, string $message): void
    {
        self::$messages[] = [
            'phone' => $phone,
            'message' => $message,
        ];
    }

    public static function exposeForDevelopment(
        string $phone,
        OtpPurpose $purpose,
        string $otp,
    ): void {
        if (! self::shouldExposePlainOtp()) {
            return;
        }

        self::$developmentOtps[] = [
            'phone' => $phone,
            'purpose' => $purpose->value,
            'otp' => $otp,
        ];

        Log::info('OTP issued for development testing', [
            'phone' => $phone,
            'purpose' => $purpose->value,
            'otp' => $otp,
        ]);
    }

    public static function shouldExposePlainOtp(): bool
    {
        if (app()->environment('production')) {
            return false;
        }

        if (self::isProductionEnvironment()) {
            return false;
        }

        if (! app()->environment(['local', 'testing'])) {
            return false;
        }

        if (self::msegatCredentialsConfigured()) {
            return false;
        }

        return true;
    }

    public static function isProductionEnvironment(): bool
    {
        return SmsProviderFactory::isProductionEnvironment();
    }

    public static function msegatCredentialsConfigured(): bool
    {
        $config = config('services.msegat', []);

        return ! empty($config['username'])
            && ! empty($config['api_key'])
            && ! empty($config['sender_id']);
    }

    public static function flush(): void
    {
        self::$messages = [];
        self::$developmentOtps = [];
    }

    public static function lastMessage(): ?string
    {
        if (self::$messages === []) {
            return null;
        }

        return self::$messages[array_key_last(self::$messages)]['message'];
    }

    /**
     * @return array{phone: string, purpose: string, otp: string}|null
     */
    public static function lastDevelopmentOtp(): ?array
    {
        if (self::$developmentOtps === []) {
            return null;
        }

        return self::$developmentOtps[array_key_last(self::$developmentOtps)];
    }
}
