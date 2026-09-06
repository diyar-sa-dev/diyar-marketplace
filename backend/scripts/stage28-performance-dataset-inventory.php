<?php

declare(strict_types=1);

/**
 * Stage 28.7 — Table row counts for performance dataset tiers.
 * Usage: php scripts/stage28-performance-dataset-inventory.php
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$tables = [
    'users',
    'products',
    'product_inventory',
    'orders',
    'order_items',
    'vendor_orders',
    'payments',
    'user_notifications',
    'analytics_events',
    'conversations',
    'messages',
    'chat_messages',
    'affiliate_clicks',
    'affiliate_commissions',
    'reviews',
    'product_reviews',
    'store_reviews',
    'carts',
    'cart_items',
    'b2b_companies',
    'b2b_leads',
    'services',
    'bookings',
];

$counts = [];
foreach ($tables as $table) {
    if (! Schema::hasTable($table)) {
        $counts[$table] = ['exists' => false, 'count' => null];

        continue;
    }

    $counts[$table] = [
        'exists' => true,
        'count' => (int) DB::table($table)->count(),
    ];
}

$dbVersion = config('database.default') === 'sqlite'
    ? 'sqlite'
    : (DB::selectOne('SELECT VERSION() AS v')?->v ?? 'unknown');

$result = [
    'timestamp_utc' => gmdate('c'),
    'database' => config('database.connections.'.config('database.default').'.database'),
    'engine_version' => $dbVersion,
    'tables' => $counts,
    'totals' => [
        'users' => $counts['users']['count'] ?? 0,
        'products' => $counts['products']['count'] ?? 0,
        'orders' => $counts['orders']['count'] ?? 0,
        'order_items' => $counts['order_items']['count'] ?? 0,
        'user_notifications' => $counts['user_notifications']['count'] ?? 0,
        'analytics_events' => $counts['analytics_events']['count'] ?? 0,
    ],
];

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
