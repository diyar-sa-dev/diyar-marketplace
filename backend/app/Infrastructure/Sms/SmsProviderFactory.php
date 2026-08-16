<?php

namespace App\Infrastructure\Sms;

use App\Contracts\Sms\SmsProvider;
use Illuminate\Support\Facades\Log;
use RuntimeException;

final class SmsProviderFactory
{
    public static function make(): SmsProvider
    {
        if (LogSmsProvider::msegatCredentialsConfigured()) {
            $config = config('services.msegat');

            return new MsegatSmsProvider(
                username: (string) $config['username'],
                apiKey: (string) $config['api_key'],
                senderId: (string) $config['sender_id'],
                lang: (string) $config['lang'],
                baseUrl: (string) $config['base_url'],
            );
        }

        if (self::isProductionEnvironment()) {
            Log::error('MSEGAT credentials are missing while APP_ENV is production.');

            throw new RuntimeException('SMS provider is not configured for production.');
        }

        return new LogSmsProvider;
    }

    public static function isProductionEnvironment(): bool
    {
        return strcasecmp((string) config('app.env'), 'production') === 0;
    }
}
