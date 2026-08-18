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

    'cart' => [
        'max_quantity_per_item' => (int) env('DIYAR_CART_MAX_QUANTITY_PER_ITEM', 99),
    ],

    'tax' => [
        'vat_rate' => env('DIYAR_VAT_RATE', '0.15'),
    ],

    'shipping' => [
        'default_carrier_flat_rate' => env('DIYAR_SHIPPING_DEFAULT_CARRIER_FLAT_RATE', '28.00'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Payments (Stage 8)
    |--------------------------------------------------------------------------
    */

    'payments' => [
        'gateway' => env('DIYAR_PAYMENT_GATEWAY', 'myfatoorah'),
        'currency' => env('DIYAR_PAYMENT_CURRENCY', 'SAR'),
        'session_expiry_minutes' => (int) env('DIYAR_PAYMENT_SESSION_EXPIRY_MINUTES', 30),
        'use_fake_gateway' => (static function (): bool {
            $explicit = env('DIYAR_PAYMENT_USE_FAKE_GATEWAY');

            if ($explicit === null || $explicit === '') {
                return in_array(env('APP_ENV', 'production'), ['local', 'testing'], true);
            }

            return filter_var($explicit, FILTER_VALIDATE_BOOL);
        })(),
    ],

    /*
    |--------------------------------------------------------------------------
    | Finance (Stage 9)
    |--------------------------------------------------------------------------
    */

    'finance' => [
        'currency' => env('DIYAR_FINANCE_CURRENCY', 'SAR'),
        'escrow_release_trigger' => env('DIYAR_ESCROW_RELEASE_TRIGGER', 'vendor_order_delivered'),
        'payout_minimum' => env('DIYAR_PAYOUT_MINIMUM', '100.00'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Manual Orders (internal/future — not exposed in V1 vendor UI)
    |--------------------------------------------------------------------------
    */

    'manual_orders' => [
        'api_enabled' => filter_var(env('DIYAR_MANUAL_ORDERS_API_ENABLED', false), FILTER_VALIDATE_BOOL),
    ],

    /*
    |--------------------------------------------------------------------------
    | Returns & Refunds (Stage 11)
    |--------------------------------------------------------------------------
    */

    'returns' => [
        'platform_baseline' => [
            'returnable' => true,
            'return_window_days' => 14,
            'accepted_reasons' => [
                'manufacturing_defect',
                'damaged',
                'wrong_item',
                'not_as_described',
            ],
            'requires_unused' => true,
            'requires_evidence' => true,
            'return_shipping_paid_by' => 'customer',
            'shipping_refundable' => false,
        ],
    ],
];
