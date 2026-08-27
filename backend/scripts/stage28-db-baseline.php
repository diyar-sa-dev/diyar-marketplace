<?php

declare(strict_types=1);

/**
 * Stage 28.1 — Database baseline snapshot (read-only).
 * Usage: php scripts/stage28-db-baseline.php
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$driver = config('database.default');
$connection = DB::connection();

$result = [
    'timestamp_utc' => gmdate('c'),
    'connection' => [
        'driver' => $driver,
        'database' => config("database.connections.{$driver}.database"),
        'host' => config("database.connections.{$driver}.host"),
    ],
    'engine_version' => null,
    'tables' => [],
    'migration_count' => count(glob(database_path('migrations/*.php')) ?: []),
];

try {
    if ($driver === 'mysql') {
        $versionRow = DB::selectOne('SELECT VERSION() AS version');
        $result['engine_version'] = $versionRow->version ?? null;
    } elseif ($driver === 'sqlite') {
        $versionRow = DB::selectOne('SELECT sqlite_version() AS version');
        $result['engine_version'] = 'SQLite '.($versionRow->version ?? 'unknown');
    }
} catch (Throwable $e) {
    $result['engine_version_error'] = $e->getMessage();
}

$critical = [
    'users', 'products', 'product_variants', 'carts', 'cart_items', 'orders', 'order_items',
    'vendor_orders', 'payments', 'financial_transactions', 'returns', 'refunds',
    'services', 'service_bookings', 'reviews', 'coupons', 'notifications',
    'conversations', 'messages', 'affiliate_links', 'affiliate_commissions',
    'loyalty_accounts', 'loyalty_transactions', 'b2b_companies', 'blog_articles',
    'sessions', 'jobs', 'failed_jobs', 'cache', 'cache_locks',
];

$tableNames = Schema::getTableListing();
$result['table_count'] = count($tableNames);

foreach ($critical as $table) {
    if (! Schema::hasTable($table)) {
        $result['tables'][$table] = ['exists' => false];
        continue;
    }

    $row = ['exists' => true, 'row_count' => null, 'index_count' => null];

    try {
        $row['row_count'] = (int) DB::table($table)->count();
    } catch (Throwable $e) {
        $row['row_count_error'] = $e->getMessage();
    }

    try {
        if ($driver === 'mysql') {
            $indexes = DB::select(
                'SELECT COUNT(DISTINCT INDEX_NAME) AS c FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME != ?',
                [config("database.connections.{$driver}.database"), $table, 'PRIMARY']
            );
            $row['index_count'] = (int) ($indexes[0]->c ?? 0);
        }
    } catch (Throwable $e) {
        $row['index_count_error'] = $e->getMessage();
    }

    $result['tables'][$table] = $row;
}

// Largest tables by row count (sample)
$sizes = [];
foreach ($tableNames as $table) {
    try {
        $sizes[$table] = (int) DB::table($table)->count();
    } catch (Throwable) {
        continue;
    }
}
arsort($sizes);
$result['largest_tables_by_rows'] = array_slice($sizes, 0, 15, true);

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
