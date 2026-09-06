<?php

return [

    /*
    |--------------------------------------------------------------------------
    | CDN / asset delivery (Phase 28.13)
    |--------------------------------------------------------------------------
    |
    | Optional CDN origin for hashed frontend assets and public media.
    | Leave null to serve from the same origin (VPS Nginx).
    |
    */

    'cdn' => [
        'enabled' => filter_var(env('DIYAR_CDN_ENABLED', false), FILTER_VALIDATE_BOOL),
        'assets_base_url' => env('DIYAR_CDN_ASSETS_URL'),
        'media_base_url' => env('DIYAR_CDN_MEDIA_URL'),
    ],

    /*
    |--------------------------------------------------------------------------
    | HTTP cache TTLs (seconds) — edge/browser hints only
    |--------------------------------------------------------------------------
    |
    | Application Redis cache (28.11) remains authoritative for catalog data.
    | These headers help anonymous visitors and CDN edges without cookies.
    |
    */

    'http_cache' => [
        'public_api_seconds' => (int) env('DIYAR_HTTP_PUBLIC_API_CACHE_SECONDS', 60),
        'public_api_stale_while_revalidate' => (int) env('DIYAR_HTTP_PUBLIC_API_SWR_SECONDS', 120),
        'platform_config_seconds' => (int) env('DIYAR_HTTP_PLATFORM_CONFIG_CACHE_SECONDS', 300),
        'health_seconds' => (int) env('DIYAR_HTTP_HEALTH_CACHE_SECONDS', 15),
    ],

    /*
    |--------------------------------------------------------------------------
    | Public GET route prefixes (relative to /api/v1)
    |--------------------------------------------------------------------------
    */

    'public_read_prefixes' => [
        'storefront/home',
        'categories',
        'products',
        'search',
        'catalog/search',
        'catalog/search/suggestions',
        'vendors',
        'service-categories',
        'services',
        'providers',
        'blog',
        'projects',
        'b2b/companies',
        'b2b/categories',
        'platform/theme',
        'platform/commerce',
    ],

    'platform_config_paths' => [
        'platform/theme',
        'platform/commerce',
    ],

    /*
    |--------------------------------------------------------------------------
    | Private GET prefixes — never publicly cacheable (relative to /api/v1)
    |--------------------------------------------------------------------------
    */

    'private_read_prefixes' => [
        'cart',
        'auth',
        'admin',
        'dashboard',
        'orders',
        'checkout',
        'payment',
        'payments',
        'chat',
        'conversations',
        'messages',
        'profile',
        'wishlist',
        'loyalty',
        'returns',
        'notifications',
        'identity',
        'webhooks',
        'assistant',
        'affiliate/referrals',
        'platform/consultation',
    ],

];
