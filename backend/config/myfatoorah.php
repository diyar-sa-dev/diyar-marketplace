<?php

return [
    'api_key' => env('MYFATOORAH_API_KEY', ''),

    'test_mode' => filter_var(env('MYFATOORAH_TEST_MODE', true), FILTER_VALIDATE_BOOL),

    'country_iso' => env('MYFATOORAH_COUNTRY_ISO', 'SAU'),

    'save_card' => filter_var(env('MYFATOORAH_SAVE_CARD', false), FILTER_VALIDATE_BOOL),

    'webhook_secret_key' => env('MYFATOORAH_WEBHOOK_SECRET_KEY', ''),

    'register_apple_pay' => filter_var(env('MYFATOORAH_REGISTER_APPLE_PAY', false), FILTER_VALIDATE_BOOL),

    /*
    | Disable SSL verification only for local Windows dev when CA bundle fails.
    | Defaults to false verification on APP_ENV=local unless explicitly set.
    */
    'ssl_verify' => (static function (): bool {
        $explicit = env('MYFATOORAH_SSL_VERIFY');

        if ($explicit === null || $explicit === '') {
            return env('APP_ENV', 'production') !== 'local';
        }

        return filter_var($explicit, FILTER_VALIDATE_BOOL);
    })(),

    /*
    | HTTPS callback base for MyFatoorah (required — http://localhost is rejected).
    | Use ngrok/cloudflare tunnel in local dev, e.g. https://abc123.ngrok-free.app
    */
    'redirect_url' => env('MYFATOORAH_REDIRECT_URL'),
];
