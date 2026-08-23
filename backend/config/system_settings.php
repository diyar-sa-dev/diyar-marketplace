<?php

$arFontStacks = [
    'Alexandria, Tajawal, sans-serif',
    'Tajawal, Alexandria, sans-serif',
    'Cairo, Tajawal, sans-serif',
    'IBM Plex Sans Arabic, Tajawal, sans-serif',
];

$enFontStacks = [
    'Outfit, Inter, sans-serif',
    'Inter, system-ui, sans-serif',
    'Outfit, system-ui, sans-serif',
    'Plus Jakarta Sans, Inter, sans-serif',
];

return [

    /*
    |--------------------------------------------------------------------------
    | Cache
    |--------------------------------------------------------------------------
    */

    'cache_ttl_seconds' => (int) env('DIYAR_SETTINGS_CACHE_TTL', 3600),

    'cache_prefix' => env('DIYAR_SETTINGS_CACHE_PREFIX', 'diyar:settings:'),

    /*
    |--------------------------------------------------------------------------
    | Sensitive key patterns (never public, never seeded from secrets)
    |--------------------------------------------------------------------------
    */

    'sensitive_key_patterns' => [
        'password',
        'secret',
        'api_key',
        'token',
        'credential',
        'private_key',
    ],

    /*
    |--------------------------------------------------------------------------
    | Setting definitions (validation + metadata for admin UI)
    |--------------------------------------------------------------------------
    */

    'definitions' => [

        // Platform support & assistant
        'platform.support_phone' => [
            'group' => 'platform',
            'key' => 'support_phone',
            'type' => 'string',
            'config_path' => 'diyar.platform.support_phone',
            'is_public' => true,
            'validation' => ['required', 'string', 'max:30'],
        ],
        'platform.support_email' => [
            'group' => 'platform',
            'key' => 'support_email',
            'type' => 'string',
            'config_path' => 'diyar.platform.support_email',
            'is_public' => true,
            'validation' => ['required', 'email', 'max:255'],
        ],
        'platform.support_hours' => [
            'group' => 'platform',
            'key' => 'support_hours',
            'type' => 'string',
            'config_path' => 'diyar.platform.support_hours',
            'is_public' => true,
            'validation' => ['required', 'string', 'max:64'],
        ],
        'platform.assistant_enabled' => [
            'group' => 'platform',
            'key' => 'assistant_enabled',
            'type' => 'boolean',
            'config_path' => 'diyar.assistant.enabled',
            'is_public' => true,
            'validation' => ['required', 'boolean'],
        ],
        'platform.marketplace_maintenance_enabled' => [
            'group' => 'platform',
            'key' => 'marketplace_maintenance_enabled',
            'type' => 'boolean',
            'config_path' => 'diyar.maintenance.marketplace_enabled',
            'is_public' => true,
            'validation' => ['required', 'boolean'],
        ],
        'platform.maintenance_message_ar' => [
            'group' => 'platform',
            'key' => 'maintenance_message_ar',
            'type' => 'string',
            'config_path' => 'diyar.maintenance.message_ar',
            'is_public' => true,
            'validation' => ['required', 'string', 'max:500'],
        ],
        'platform.maintenance_message_en' => [
            'group' => 'platform',
            'key' => 'maintenance_message_en',
            'type' => 'string',
            'config_path' => 'diyar.maintenance.message_en',
            'is_public' => true,
            'validation' => ['required', 'string', 'max:500'],
        ],

        // Affiliate
        'affiliate.platform_min_commission_percent' => [
            'group' => 'affiliate',
            'key' => 'platform_min_commission_percent',
            'type' => 'decimal',
            'config_path' => 'diyar.affiliate.platform_min_commission_percent',
            'is_public' => false,
            'validation' => ['required', 'numeric', 'min:0', 'max:100'],
        ],
        'affiliate.platform_max_commission_percent' => [
            'group' => 'affiliate',
            'key' => 'platform_max_commission_percent',
            'type' => 'decimal',
            'config_path' => 'diyar.affiliate.platform_max_commission_percent',
            'is_public' => false,
            'validation' => ['required', 'numeric', 'min:0', 'max:100'],
        ],
        'affiliate.attribution_window_days' => [
            'group' => 'affiliate',
            'key' => 'attribution_window_days',
            'type' => 'integer',
            'config_path' => 'diyar.affiliate.attribution_window_days',
            'is_public' => false,
            'validation' => ['required', 'integer', 'min:1', 'max:365'],
        ],
        'affiliate.payout_minimum' => [
            'group' => 'affiliate',
            'key' => 'payout_minimum',
            'type' => 'decimal',
            'config_path' => 'diyar.affiliate.payout_minimum',
            'is_public' => false,
            'validation' => ['required', 'numeric', 'min:0'],
        ],

        // Commerce
        'commerce.vat_rate' => [
            'group' => 'commerce',
            'key' => 'vat_rate',
            'type' => 'decimal',
            'config_path' => 'diyar.commerce.vat_rate',
            'is_public' => false,
            'validation' => ['required', 'numeric', 'min:0', 'max:1'],
        ],
        'commerce.currency' => [
            'group' => 'commerce',
            'key' => 'currency',
            'type' => 'string',
            'config_path' => 'diyar.commerce.currency',
            'is_public' => false,
            'validation' => ['required', 'string', 'size:3'],
        ],
        'commerce.cart_max_quantity_per_item' => [
            'group' => 'commerce',
            'key' => 'cart_max_quantity_per_item',
            'type' => 'integer',
            'config_path' => 'diyar.commerce.cart_max_quantity_per_item',
            'is_public' => false,
            'validation' => ['required', 'integer', 'min:1', 'max:999'],
        ],
        'commerce.loyalty_sar_per_point' => [
            'group' => 'commerce',
            'key' => 'loyalty_sar_per_point',
            'type' => 'integer',
            'config_path' => 'diyar.commerce.loyalty_sar_per_point',
            'is_public' => true,
            'validation' => ['required', 'integer', 'min:1', 'max:10000'],
        ],

        // Orders
        'orders.inventory_reservation_timeout_minutes' => [
            'group' => 'orders',
            'key' => 'inventory_reservation_timeout_minutes',
            'type' => 'integer',
            'config_path' => 'diyar.orders.inventory_reservation_timeout_minutes',
            'is_public' => false,
            'validation' => ['required', 'integer', 'min:1', 'max:1440'],
        ],

        // Shipping
        'shipping.default_carrier_flat_rate' => [
            'group' => 'shipping',
            'key' => 'default_carrier_flat_rate',
            'type' => 'decimal',
            'config_path' => 'diyar.shipping.default_carrier_flat_rate',
            'is_public' => false,
            'validation' => ['required', 'numeric', 'min:0'],
        ],

        // Payouts
        'payouts.vendor_minimum' => [
            'group' => 'payouts',
            'key' => 'vendor_minimum',
            'type' => 'decimal',
            'config_path' => 'diyar.payouts.vendor_minimum',
            'is_public' => false,
            'validation' => ['required', 'numeric', 'min:0'],
        ],
        'payouts.affiliate_minimum' => [
            'group' => 'payouts',
            'key' => 'affiliate_minimum',
            'type' => 'decimal',
            'config_path' => 'diyar.payouts.affiliate_minimum',
            'is_public' => false,
            'validation' => ['required', 'numeric', 'min:0'],
        ],

        // Services
        'services.platform_commission_rate' => [
            'group' => 'services',
            'key' => 'platform_commission_rate',
            'type' => 'decimal',
            'config_path' => 'diyar.services.platform_commission_rate',
            'is_public' => false,
            'validation' => ['required', 'numeric', 'min:0', 'max:1'],
        ],
        'services.default_booking_duration_minutes' => [
            'group' => 'services',
            'key' => 'default_booking_duration_minutes',
            'type' => 'integer',
            'config_path' => 'diyar.services.default_booking_duration_minutes',
            'is_public' => false,
            'validation' => ['required', 'integer', 'min:15', 'max:480'],
        ],

        // Notifications
        'notifications.realtime_enabled' => [
            'group' => 'notifications',
            'key' => 'realtime_enabled',
            'type' => 'boolean',
            'config_path' => 'diyar.notifications.realtime_enabled',
            'is_public' => false,
            'validation' => ['required', 'boolean'],
        ],

        // Chat retention (operational)
        'chat.archive_enabled' => [
            'group' => 'chat',
            'key' => 'archive_enabled',
            'type' => 'boolean',
            'config_path' => 'diyar.chat.retention.archive_enabled',
            'is_public' => false,
            'validation' => ['required', 'boolean'],
        ],
        'chat.archive_after_days' => [
            'group' => 'chat',
            'key' => 'archive_after_days',
            'type' => 'integer',
            'config_path' => 'diyar.chat.retention.archive_after_days',
            'is_public' => false,
            'validation' => ['required', 'integer', 'min:1', 'max:3650'],
        ],
        'chat.purge_after_archive' => [
            'group' => 'chat',
            'key' => 'purge_after_archive',
            'type' => 'boolean',
            'config_path' => 'diyar.chat.retention.purge_after_archive',
            'is_public' => false,
            'validation' => ['required', 'boolean'],
        ],

        // Feature flags
        'feature.affiliate_enabled' => [
            'group' => 'feature',
            'key' => 'affiliate_enabled',
            'type' => 'boolean',
            'config_path' => 'diyar.feature.affiliate_enabled',
            'is_public' => false,
            'validation' => ['required', 'boolean'],
        ],
        'feature.reviews_enabled' => [
            'group' => 'feature',
            'key' => 'reviews_enabled',
            'type' => 'boolean',
            'config_path' => 'diyar.feature.reviews_enabled',
            'is_public' => false,
            'validation' => ['required', 'boolean'],
        ],
        'feature.services_enabled' => [
            'group' => 'feature',
            'key' => 'services_enabled',
            'type' => 'boolean',
            'config_path' => 'diyar.feature.services_enabled',
            'is_public' => false,
            'validation' => ['required', 'boolean'],
        ],
        'feature.coupons_enabled' => [
            'group' => 'feature',
            'key' => 'coupons_enabled',
            'type' => 'boolean',
            'config_path' => 'diyar.feature.coupons_enabled',
            'is_public' => false,
            'validation' => ['required', 'boolean'],
        ],

        // Theme (public tokens for storefront bootstrap)
        'theme.primary_color' => [
            'group' => 'theme',
            'key' => 'primary_color',
            'type' => 'color',
            'config_path' => 'diyar.theme.primary_color',
            'is_public' => true,
            'validation' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ],
        'theme.primary_dark' => [
            'group' => 'theme',
            'key' => 'primary_dark',
            'type' => 'color',
            'config_path' => 'diyar.theme.primary_dark',
            'is_public' => true,
            'validation' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ],
        'theme.surface_color' => [
            'group' => 'theme',
            'key' => 'surface_color',
            'type' => 'color',
            'config_path' => 'diyar.theme.surface_color',
            'is_public' => true,
            'validation' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ],
        'theme.font_family_ar' => [
            'group' => 'theme',
            'key' => 'font_family_ar',
            'type' => 'string',
            'config_path' => 'diyar.theme.font_family_ar',
            'is_public' => true,
            'allowed_values' => $arFontStacks,
            'validation' => ['required', 'string'],
        ],
        'theme.font_family_en' => [
            'group' => 'theme',
            'key' => 'font_family_en',
            'type' => 'string',
            'config_path' => 'diyar.theme.font_family_en',
            'is_public' => true,
            'allowed_values' => $enFontStacks,
            'validation' => ['required', 'string'],
        ],
        'theme.vendor_accent_color' => [
            'group' => 'theme',
            'key' => 'vendor_accent_color',
            'type' => 'color',
            'config_path' => 'diyar.theme.vendor_accent_color',
            'is_public' => true,
            'validation' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ],
        'theme.provider_accent_color' => [
            'group' => 'theme',
            'key' => 'provider_accent_color',
            'type' => 'color',
            'config_path' => 'diyar.theme.provider_accent_color',
            'is_public' => true,
            'validation' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ],
        'theme.affiliate_accent_color' => [
            'group' => 'theme',
            'key' => 'affiliate_accent_color',
            'type' => 'color',
            'config_path' => 'diyar.theme.affiliate_accent_color',
            'is_public' => true,
            'validation' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ],
    ],
];
