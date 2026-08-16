<?php

return [

    /*
    |--------------------------------------------------------------------------
    | DIYAR Application Metadata
    |--------------------------------------------------------------------------
    */

    'api_version' => env('DIYAR_API_VERSION', '1.0.0-stage3'),

    'stage' => env('DIYAR_STAGE', 'Stage 3 — User Profile & Media'),

    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),

    /*
    |--------------------------------------------------------------------------
    | OTP Configuration
    |--------------------------------------------------------------------------
    */

    'otp' => [
        'length' => (int) env('DIYAR_OTP_LENGTH', 6),
        'expires_minutes' => (int) env('DIYAR_OTP_EXPIRES_MINUTES', 10),
        'max_attempts' => (int) env('DIYAR_OTP_MAX_ATTEMPTS', 5),
        'max_resends_per_hour' => (int) env('DIYAR_OTP_MAX_RESENDS', 5),
        'resend_cooldown_seconds' => (int) env('DIYAR_OTP_RESEND_COOLDOWN', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Hardening
    |--------------------------------------------------------------------------
    */

    'auth' => [
        'login_max_attempts' => (int) env('DIYAR_LOGIN_MAX_ATTEMPTS', 5),
        'login_decay_minutes' => (int) env('DIYAR_LOGIN_DECAY_MINUTES', 15),
    ],

    /*
    |--------------------------------------------------------------------------
    | Inventory Configuration
    |--------------------------------------------------------------------------
    */

    'inventory' => [
        'reservation_timeout_minutes' => (int) env('DIYAR_INVENTORY_RESERVATION_TIMEOUT_MINUTES', 15),
    ],

];
