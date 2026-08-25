<?php

return [

    /*
    |--------------------------------------------------------------------------
    | DIYAR Application Metadata
    |--------------------------------------------------------------------------
    */

    'api_version' => env('DIYAR_API_VERSION', '1.0.0-stage3'),

    'stage' => env('DIYAR_STAGE', 'Stage 3 — User Profile & Media'),

    'frontend_url' => env('DIYAR_FRONTEND_URL', env('FRONTEND_URL', 'http://localhost:5173')),

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
    | Local demo seed credentials (never used in production seeders)
    |--------------------------------------------------------------------------
    */

    'demo' => [
        'password' => env('DIYAR_DEMO_PASSWORD', 'Password123!'),
    ],

    'rate_limits' => [
        'wishlist_toggle_per_minute' => (int) env('DIYAR_WISHLIST_TOGGLE_RATE_LIMIT', 60),
        'auth_per_minute' => (int) env('DIYAR_AUTH_RATE_LIMIT', 20),
        'otp_per_minute' => (int) env('DIYAR_OTP_RATE_LIMIT', 10),
        'catalog_search_per_minute' => (int) env('DIYAR_CATALOG_SEARCH_RATE_LIMIT', 60),
        'catalog_search_suggestions_per_minute' => (int) env('DIYAR_CATALOG_SEARCH_SUGGESTIONS_RATE_LIMIT', 90),
        'webhooks_per_minute' => (int) env('DIYAR_WEBHOOKS_RATE_LIMIT', 120),
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

    /*
    |--------------------------------------------------------------------------
    | Commerce (runtime settings — Phase 18.3)
    |--------------------------------------------------------------------------
    */

    'commerce' => [
        'vat_rate' => env('DIYAR_VAT_RATE', '0.15'),
        'currency' => env('DIYAR_COMMERCE_CURRENCY', env('DIYAR_PAYMENT_CURRENCY', 'SAR')),
        'cart_max_quantity_per_item' => (int) env('DIYAR_CART_MAX_QUANTITY_PER_ITEM', 99),
        'loyalty_sar_per_point' => (int) env('DIYAR_LOYALTY_SAR_PER_POINT', 50),
    ],

    /*
    |--------------------------------------------------------------------------
    | Orders (runtime settings — Phase 18.3)
    |--------------------------------------------------------------------------
    */

    'orders' => [
        'inventory_reservation_timeout_minutes' => (int) env('DIYAR_INVENTORY_RESERVATION_TIMEOUT_MINUTES', 15),
    ],

    'shipping' => [
        'default_carrier_flat_rate' => env('DIYAR_SHIPPING_DEFAULT_CARRIER_FLAT_RATE', '30.00'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Payouts (runtime settings — Phase 18.3)
    |--------------------------------------------------------------------------
    */

    'payouts' => [
        'vendor_minimum' => env('DIYAR_PAYOUT_MINIMUM', '100.00'),
        'affiliate_minimum' => env('DIYAR_AFFILIATE_PAYOUT_MINIMUM', '100.00'),
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

    'coupons' => [
        'percentage_min' => 5,
        'percentage_max' => 90,
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
        'payout_schedule' => [
            'min_days' => (int) env('DIYAR_PAYOUT_MIN_DAYS', 1),
            'max_days' => (int) env('DIYAR_PAYOUT_MAX_DAYS', 3),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Service marketplace (Stage 13)
    |--------------------------------------------------------------------------
    */

    'services' => [
        'platform_commission_rate' => env('DIYAR_SERVICE_COMMISSION_RATE', '0.10'),
        'default_booking_duration_minutes' => (int) env('DIYAR_DEFAULT_BOOKING_DURATION_MINUTES', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Vendor store settings (Stage 12)
    |--------------------------------------------------------------------------
    */

    'vendor' => [
        'store_domain' => env('DIYAR_STORE_DOMAIN', 'diyar.sa'),
        'low_stock_threshold' => (int) env('DIYAR_LOW_STOCK_THRESHOLD', 5),
        'reserved_slugs' => [
            'admin',
            'api',
            'dashboard',
            'login',
            'register',
            'profile',
            'orders',
            'cart',
            'checkout',
            'search',
            'vendors',
            'products',
            'settings',
            'finance',
            'support',
            'help',
            'about',
            'terms',
            'privacy',
            'null',
            'undefined',
        ],
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

    'mail' => [
        'enabled' => (function (): bool {
            $explicit = env('DIYAR_MAIL_ENABLED');
            if ($explicit !== null) {
                return filter_var($explicit, FILTER_VALIDATE_BOOL);
            }

            $username = env('DIYAR_MAIL_USERNAME', env('EMAIL_USER', env('MAIL_USERNAME')));

            return is_string($username) && $username !== '';
        })(),
        'fail_silently' => (bool) env('DIYAR_MAIL_FAIL_SILENTLY', true),
        'brand_name' => env('DIYAR_MAIL_BRAND', 'Diyar'),
        'host' => env('DIYAR_MAIL_HOST', env('EMAIL_HOST', env('MAIL_HOST', 'smtp.gmail.com'))),
        'port' => (int) env('DIYAR_MAIL_PORT', env('EMAIL_PORT', env('MAIL_PORT', 587))),
        'username' => env('DIYAR_MAIL_USERNAME', env('EMAIL_USER', env('MAIL_USERNAME'))),
        'password' => str_replace(' ', '', (string) env(
            'DIYAR_MAIL_PASSWORD',
            env('EMAIL_PASS', env('MAIL_PASSWORD', '')),
        )),
        'encryption' => env('DIYAR_MAIL_ENCRYPTION', env('EMAIL_SECURE') === 'false' ? 'tls' : 'tls'),
        'from_address' => env(
            'DIYAR_MAIL_FROM_ADDRESS',
            env('EMAIL_USER', env('MAIL_FROM_ADDRESS', 'noreply@diyar.sa')),
        ),
        'from_name' => env('DIYAR_MAIL_FROM_NAME', env('MAIL_FROM_NAME', 'Diyar')),
    ],

    'notifications' => [
        'circuit_breaker' => [
            'failure_threshold' => (int) env('DIYAR_NOTIFICATIONS_CB_FAILURES', 5),
            'cooldown_seconds' => (int) env('DIYAR_NOTIFICATIONS_CB_COOLDOWN', 120),
        ],
        'realtime_enabled' => filter_var(env('DIYAR_NOTIFICATIONS_REALTIME', true), FILTER_VALIDATE_BOOL),
        'reconciliation_poll_seconds' => (int) env('DIYAR_NOTIFICATIONS_RECONCILE_SECONDS', 120),
        'poll_interval_seconds' => (int) env('DIYAR_NOTIFICATIONS_POLL_SECONDS', 120),
        'queues' => [
            'high' => env('DIYAR_NOTIFICATIONS_QUEUE_HIGH', 'notifications-high'),
            'normal' => env('DIYAR_NOTIFICATIONS_QUEUE', 'notifications'),
            'low' => env('DIYAR_NOTIFICATIONS_QUEUE_LOW', 'notifications-low'),
        ],
        'worker' => [
            'tries' => (int) env('DIYAR_NOTIFICATIONS_WORKER_TRIES', 5),
            'timeout' => (int) env('DIYAR_NOTIFICATIONS_WORKER_TIMEOUT', 120),
            'backoff' => [30, 60, 120, 300, 600],
            'max_jobs' => (int) env('DIYAR_NOTIFICATIONS_WORKER_MAX_JOBS', 1000),
            'max_time' => (int) env('DIYAR_NOTIFICATIONS_WORKER_MAX_TIME', 3600),
            'memory' => (int) env('DIYAR_NOTIFICATIONS_WORKER_MEMORY', 128),
            'sleep' => (int) env('DIYAR_NOTIFICATIONS_WORKER_SLEEP', 3),
        ],
        'push' => [
            'driver' => env('DIYAR_PUSH_DRIVER', 'log'),
            'fcm' => [
                'project_id' => env('DIYAR_FCM_PROJECT_ID'),
                'credentials' => env('DIYAR_FCM_CREDENTIALS'),
            ],
            'apns' => [
                'key_id' => env('DIYAR_APNS_KEY_ID'),
                'team_id' => env('DIYAR_APNS_TEAM_ID'),
                'bundle_id' => env('DIYAR_APNS_BUNDLE_ID'),
                'private_key' => env('DIYAR_APNS_PRIVATE_KEY'),
                'environment' => env('DIYAR_APNS_ENVIRONMENT', 'sandbox'),
            ],
        ],
        'categories' => [
            'orders' => [
                'label' => 'diyar.notifications.categories.orders',
                'policy' => 'optional',
                'roles' => ['customer', 'vendor'],
                'channels' => ['in_app', 'email', 'push'],
            ],
            'payments' => [
                'label' => 'diyar.notifications.categories.payments',
                'policy' => 'optional',
                'roles' => ['customer', 'vendor', 'provider'],
                'channels' => ['in_app', 'email', 'push'],
            ],
            'bookings' => [
                'label' => 'diyar.notifications.categories.bookings',
                'policy' => 'optional',
                'roles' => ['customer', 'provider'],
                'channels' => ['in_app', 'email', 'push'],
            ],
            'offers' => [
                'label' => 'diyar.notifications.categories.offers',
                'policy' => 'optional',
                'roles' => ['customer', 'provider'],
                'channels' => ['in_app', 'email', 'push'],
            ],
            'reviews' => [
                'label' => 'diyar.notifications.categories.reviews',
                'policy' => 'optional',
                'roles' => ['customer', 'vendor', 'provider'],
                'channels' => ['in_app', 'email', 'push'],
            ],
            'follows' => [
                'label' => 'diyar.notifications.categories.follows',
                'policy' => 'optional',
                'roles' => ['customer', 'vendor'],
                'channels' => ['in_app', 'email', 'push'],
            ],
            'products' => [
                'label' => 'diyar.notifications.categories.products',
                'policy' => 'optional',
                'roles' => ['vendor'],
                'channels' => ['in_app', 'email', 'push'],
            ],
            'services' => [
                'label' => 'diyar.notifications.categories.services',
                'policy' => 'optional',
                'roles' => ['provider'],
                'channels' => ['in_app', 'email', 'push'],
            ],
            'vendor' => [
                'label' => 'diyar.notifications.categories.vendor',
                'policy' => 'optional',
                'roles' => ['vendor'],
                'channels' => ['in_app', 'email', 'push'],
            ],
            'payouts' => [
                'label' => 'diyar.notifications.categories.payouts',
                'policy' => 'optional',
                'roles' => ['vendor', 'provider', 'marketer'],
                'channels' => ['in_app', 'email', 'push'],
            ],
            'stock' => [
                'label' => 'diyar.notifications.categories.stock',
                'policy' => 'optional',
                'roles' => ['vendor'],
                'channels' => ['in_app', 'email', 'push'],
            ],
            'team' => [
                'label' => 'diyar.notifications.categories.team',
                'policy' => 'optional',
                'roles' => ['vendor'],
                'channels' => ['in_app', 'email', 'push'],
            ],
            'coupons' => [
                'label' => 'diyar.notifications.categories.coupons',
                'policy' => 'optional',
                'roles' => ['vendor'],
                'channels' => ['in_app', 'email', 'push'],
            ],
            'promotions' => [
                'label' => 'diyar.notifications.categories.promotions',
                'policy' => 'optional',
                'roles' => ['customer'],
                'channels' => ['in_app', 'email', 'push'],
            ],
            'system' => [
                'label' => 'diyar.notifications.categories.system',
                'policy' => 'required_in_app',
                'roles' => ['customer', 'vendor', 'provider', 'marketer', 'admin'],
                'channels' => ['in_app', 'email', 'push'],
            ],
            'auth' => [
                'label' => 'diyar.notifications.categories.auth',
                'policy' => 'required_in_app',
                'roles' => ['customer', 'vendor', 'provider', 'marketer', 'admin'],
                'channels' => ['in_app', 'email'],
            ],
            'chat' => [
                'label' => 'diyar.notifications.categories.chat',
                'policy' => 'optional',
                'roles' => ['customer', 'vendor', 'provider', 'admin'],
                'channels' => ['in_app', 'email', 'push'],
            ],
            'b2b' => [
                'label' => 'diyar.notifications.categories.b2b',
                'policy' => 'optional',
                'roles' => ['customer', 'vendor', 'provider'],
                'channels' => ['in_app', 'email', 'push'],
            ],
        ],
        'type_category_map' => [
            'auth.registration' => 'auth',
            'auth.otp' => 'auth',
            'order.created' => 'orders',
            'order.vendor_received' => 'orders',
            'order.confirmed' => 'orders',
            'order.shipped' => 'orders',
            'order.delivered' => 'orders',
            'order.cancelled' => 'orders',
            'return.updated' => 'orders',
            'payment.success' => 'payments',
            'payment.failed' => 'payments',
            'payment.refunded' => 'payments',
            'offer.received' => 'offers',
            'offer.accepted' => 'offers',
            'offer.rejected' => 'offers',
            'booking.created' => 'bookings',
            'booking.confirmed' => 'bookings',
            'booking.completed' => 'bookings',
            'booking.cancelled' => 'bookings',
            'booking.updated' => 'bookings',
            'review.created' => 'reviews',
            'review.reply' => 'reviews',
            'product.stock_low' => 'stock',
            'product.out_of_stock' => 'stock',
            'team.invitation' => 'team',
            'team.member_added' => 'team',
            'coupon.activated' => 'coupons',
            'coupon.deactivated' => 'coupons',
            'coupon.expired' => 'coupons',
            'system.alert' => 'system',
            'system.promotion' => 'promotions',
            'chat.message_received' => 'chat',
            'affiliate.commission_available' => 'payouts',
            'affiliate.payout_requested' => 'payouts',
            'b2b.company_published' => 'b2b',
            'b2b.lead_received' => 'b2b',
            'b2b.lead_accepted' => 'b2b',
            'b2b.lead_rejected' => 'b2b',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Chat (Stage 17)
    |--------------------------------------------------------------------------
    */

    'chat' => [
        'realtime_enabled' => filter_var(env('DIYAR_CHAT_REALTIME', true), FILTER_VALIDATE_BOOL),
        'cache' => [
            'prefix' => env('DIYAR_CHAT_CACHE_PREFIX', 'diyar:chat:'),
            'unread_ttl' => (int) env('DIYAR_CHAT_UNREAD_CACHE_TTL', 300),
            'summary_ttl' => (int) env('DIYAR_CHAT_SUMMARY_CACHE_TTL', 120),
        ],
        'typing' => [
            'ttl_seconds' => (int) env('DIYAR_CHAT_TYPING_TTL', 5),
            'debounce_ms' => (int) env('DIYAR_CHAT_TYPING_DEBOUNCE_MS', 1500),
        ],
        'presence' => [
            'ttl_seconds' => (int) env('DIYAR_CHAT_PRESENCE_TTL', 120),
            'suppress_notifications_when_active' => filter_var(
                env('DIYAR_CHAT_SUPPRESS_NOTIFICATIONS_WHEN_ACTIVE', env('DIYAR_CHAT_SUPPRESS_EMAIL_WHEN_ACTIVE', true)),
                FILTER_VALIDATE_BOOL,
            ),
        ],
        'rate_limits' => [
            'messages_per_minute' => (int) env('DIYAR_CHAT_MESSAGES_PER_MINUTE', 30),
            'conversations_per_minute' => (int) env('DIYAR_CHAT_CONVERSATIONS_PER_MINUTE', 10),
            'typing_per_minute' => (int) env('DIYAR_CHAT_TYPING_PER_MINUTE', 60),
            'attachments_per_minute' => (int) env('DIYAR_CHAT_ATTACHMENTS_PER_MINUTE', 10),
        ],
        'retention' => [
            'active_message_days' => (int) env('CHAT_ACTIVE_MESSAGE_DAYS', 90),
            'archive_after_days' => (int) env('CHAT_ARCHIVE_AFTER_DAYS', 5),
            'archive_enabled' => filter_var(env('CHAT_ARCHIVE_ENABLED', false), FILTER_VALIDATE_BOOL),
            'purge_after_archive' => filter_var(env('CHAT_PURGE_AFTER_ARCHIVE', false), FILTER_VALIDATE_BOOL),
            'purge_requires_safe_to_purge' => filter_var(env('CHAT_PURGE_REQUIRES_SAFE_TO_PURGE', true), FILTER_VALIDATE_BOOL),
            'auto_mark_safe_to_purge' => filter_var(env('CHAT_AUTO_MARK_SAFE_TO_PURGE', false), FILTER_VALIDATE_BOOL),
            'batch_size' => (int) env('CHAT_ARCHIVE_BATCH_SIZE', 200),
            'archive_disk' => env('CHAT_ARCHIVE_DISK', 'local'),
            'protected_context_types' => ['order', 'booking', 'return', 'dispute', 'payment'],
        ],
        'queues' => [
            'archive' => env('DIYAR_CHAT_ARCHIVE_QUEUE', 'chat-low'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Platform Support & AI Assistant
    |--------------------------------------------------------------------------
    */

    'platform' => [
        'support_phone' => env('DIYAR_SUPPORT_PHONE', '+966500000000'),
        'support_email' => env('DIYAR_SUPPORT_EMAIL', 'support@diyar.com'),
        'support_hours' => env('DIYAR_SUPPORT_HOURS', '9:00 - 18:00'),
    ],

    'assistant' => [
        'enabled' => (bool) env('DIYAR_ASSISTANT_ENABLED', true),
        'model' => env('DIYAR_OPENAI_MODEL', 'gpt-4o-mini'),
        'api_key' => env('OPENAI_API_KEY'),
        'max_tokens' => (int) env('DIYAR_ASSISTANT_MAX_TOKENS', 700),
        'verify_ssl' => filter_var(env('DIYAR_ASSISTANT_VERIFY_SSL', true), FILTER_VALIDATE_BOOL),
    ],

    /*
    |--------------------------------------------------------------------------
    | Affiliate / Referral Commerce
    |--------------------------------------------------------------------------
    */

    'affiliate' => [
        'platform_min_commission_percent' => (float) env('DIYAR_AFFILIATE_MIN_COMMISSION_PERCENT', 1),
        'platform_max_commission_percent' => (float) env('DIYAR_AFFILIATE_MAX_COMMISSION_PERCENT', 30),
        'attribution_window_days' => (int) env('DIYAR_AFFILIATE_ATTRIBUTION_DAYS', 30),
        'payout_minimum' => env('DIYAR_AFFILIATE_PAYOUT_MINIMUM', '100.00'),
        'currency' => env('DIYAR_AFFILIATE_CURRENCY', 'SAR'),
        'click_rate_limit_per_minute' => (int) env('DIYAR_AFFILIATE_CLICK_RATE_LIMIT', 30),
        'resolve_rate_limit_per_minute' => (int) env('DIYAR_AFFILIATE_RESOLVE_RATE_LIMIT', 30),
        'click_dedupe_window_minutes' => (int) env('DIYAR_AFFILIATE_CLICK_DEDUPE_MINUTES', 60),
        'link_rate_limit_per_minute' => (int) env('DIYAR_AFFILIATE_LINK_RATE_LIMIT', 20),
        'commission_available_on' => env('DIYAR_AFFILIATE_COMMISSION_AVAILABLE_ON', 'vendor_order_delivered'),
        'cache_dashboard_seconds' => (int) env('DIYAR_AFFILIATE_DASHBOARD_CACHE_SECONDS', 120),
    ],

    /*
    |--------------------------------------------------------------------------
    | Admin Panel (Stage 18)
    |--------------------------------------------------------------------------
    | Requires PHP ext-intl for Filament.
    */

    'admin' => [
        'default_locale' => env('DIYAR_ADMIN_DEFAULT_LOCALE', 'ar'),
        'supported_locales' => ['ar', 'en'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Feature flags (runtime settings — Phase 18.3)
    |--------------------------------------------------------------------------
    */

    'feature' => [
        'affiliate_enabled' => filter_var(env('DIYAR_FEATURE_AFFILIATE_ENABLED', true), FILTER_VALIDATE_BOOL),
        'reviews_enabled' => filter_var(env('DIYAR_FEATURE_REVIEWS_ENABLED', true), FILTER_VALIDATE_BOOL),
        'services_enabled' => filter_var(env('DIYAR_FEATURE_SERVICES_ENABLED', true), FILTER_VALIDATE_BOOL),
        'coupons_enabled' => filter_var(env('DIYAR_FEATURE_COUPONS_ENABLED', true), FILTER_VALIDATE_BOOL),
    ],

    /*
    |--------------------------------------------------------------------------
    | Theme tokens (runtime settings — Phase 18.3)
    |--------------------------------------------------------------------------
    */

    'theme' => [
        'primary_color' => env('DIYAR_THEME_PRIMARY_COLOR', '#947961'),
        'primary_dark' => env('DIYAR_THEME_PRIMARY_DARK', '#1f3d3a'),
        'surface_color' => env('DIYAR_THEME_SURFACE_COLOR', '#f3ecdb'),
        'border_radius' => env('DIYAR_THEME_BORDER_RADIUS', '0.5rem'),
        'font_family_ar' => env('DIYAR_THEME_FONT_AR', 'Alexandria, Tajawal, sans-serif'),
        'font_family_en' => env('DIYAR_THEME_FONT_EN', 'Outfit, Inter, sans-serif'),
        'vendor_accent_color' => env('DIYAR_THEME_VENDOR_ACCENT', '#947961'),
        'provider_accent_color' => env('DIYAR_THEME_PROVIDER_ACCENT', '#2563eb'),
        'affiliate_accent_color' => env('DIYAR_THEME_AFFILIATE_ACCENT', '#16a34a'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Marketplace maintenance (storefront only — admin panel stays available)
    |--------------------------------------------------------------------------
    */

    'maintenance' => [
        'marketplace_enabled' => filter_var(env('DIYAR_MARKETPLACE_MAINTENANCE', false), FILTER_VALIDATE_BOOL),
        'message_ar' => env('DIYAR_MAINTENANCE_MESSAGE_AR', 'المنصة قيد الصيانة حالياً. نعود قريباً.'),
        'message_en' => env('DIYAR_MAINTENANCE_MESSAGE_EN', 'The marketplace is under maintenance. We will be back soon.'),
    ],

    'infrastructure' => [
        'enforce_redis_in_production' => filter_var(env('DIYAR_ENFORCE_REDIS_IN_PRODUCTION', true), FILTER_VALIDATE_BOOL),
    ],

    'loadtest' => [
        'enabled' => filter_var(env('DIYAR_LOADTEST_MODE', false), FILTER_VALIDATE_BOOL),
        'health_probe_cache_seconds' => (int) env('DIYAR_HEALTH_PROBE_CACHE_SECONDS', 0),
    ],
];
