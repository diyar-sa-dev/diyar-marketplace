<?php

declare(strict_types=1);

/**
 * Stage 28.2 — Query count baseline for selected workflows (SQLite testing env).
 * Usage: php scripts/stage28-db-query-profile.php
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';

putenv('APP_ENV=testing');
putenv('DB_CONNECTION=sqlite');
putenv('DB_DATABASE=:memory:');
$_ENV['APP_ENV'] = 'testing';
$_ENV['DB_CONNECTION'] = 'sqlite';
$_ENV['DB_DATABASE'] = ':memory:';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$result = [
    'timestamp_utc' => gmdate('c'),
    'environment' => 'sqlite :memory: (phpunit-equivalent)',
    'workflows' => [],
];

function profileWorkflow(array &$result, string $name, callable $setup, callable $action): void
{
    $setup();
    DB::flushQueryLog();
    DB::enableQueryLog();
    $started = microtime(true);
    try {
        $action();
        $queries = DB::getQueryLog();
        $times = array_map(fn ($q) => $q['time'] ?? 0, $queries);
        $result['workflows'][$name] = [
            'status' => 'PASS',
            'query_count' => count($queries),
            'total_db_time_ms' => round(array_sum($times), 2),
            'slowest_query_ms' => count($times) ? round(max($times), 2) : 0,
            'duration_ms' => round((microtime(true) - $started) * 1000, 2),
            'duplicate_sql_count' => count($queries) - count(array_unique(array_column($queries, 'query'))),
            'sample_queries' => array_slice(array_map(fn ($q) => [
                'sql' => substr($q['query'] ?? '', 0, 120),
                'time_ms' => $q['time'] ?? 0,
            ], $queries), 0, 5),
        ];
    } catch (Throwable $e) {
        $result['workflows'][$name] = [
            'status' => 'ERROR',
            'error' => $e->getMessage(),
            'query_count' => count(DB::getQueryLog()),
        ];
    } finally {
        DB::disableQueryLog();
    }
}

// Bootstrap schema once
Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);

profileWorkflow($result, 'list_products', function () {}, function () {
    \App\Models\Product::query()->with(['category', 'inventory'])->limit(20)->get();
});

profileWorkflow($result, 'list_orders_with_items', function () {
    \Tests\TestCase::class; // ensure autoload
}, function () {
    if (\Illuminate\Support\Facades\Schema::hasTable('orders')) {
        \App\Models\Order::query()->with(['items', 'user'])->limit(10)->get();
    }
});

profileWorkflow($result, 'vendor_analytics_aggregate', function () {}, function () {
    if (class_exists(\App\Services\Analytics\VendorAnalyticsService::class)) {
        // No-op if no vendor data — still measures empty query path
        \App\Models\VendorOrder::query()->selectRaw('COUNT(*) as c')->value('c');
    }
});

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
