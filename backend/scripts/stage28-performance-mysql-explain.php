<?php

declare(strict_types=1);

/**
 * Stage 28.7 — EXPLAIN snapshots for analytics-heavy SQL (measurement only).
 * Usage: php scripts/stage28-performance-mysql-explain.php
 */

use App\Services\Analytics\AdminAnalyticsService;
use App\Services\Analytics\AnalyticsDateRangeResolver;
use App\Services\Analytics\VendorAnalyticsService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (config('database.default') === 'sqlite') {
    echo json_encode([
        'timestamp_utc' => gmdate('c'),
        'skipped' => true,
        'reason' => 'EXPLAIN ANALYZE requires MySQL 8 — not SQLite',
    ], JSON_PRETTY_PRINT).PHP_EOL;
    exit(0);
}

$dbVersion = DB::selectOne('SELECT VERSION() AS v')?->v ?? 'unknown';
$isMysql = is_string($dbVersion) && ! str_contains(strtolower($dbVersion), 'sqlite');

$result = [
    'timestamp_utc' => gmdate('c'),
    'engine_version' => $dbVersion,
    'queries' => [],
];

function captureExplain(string $label, string $sql, array $bindings = [], bool $runAnalyze = true): array
{
    $entry = ['label' => $label, 'sql_preview' => substr($sql, 0, 200)];

    try {
        $entry['explain'] = DB::select('EXPLAIN '.$sql, $bindings);
    } catch (Throwable $e) {
        $entry['explain_error'] = $e->getMessage();
    }

    if ($runAnalyze) {
        try {
            $rows = DB::select('EXPLAIN ANALYZE '.$sql, $bindings);
            $entry['explain_analyze'] = array_map(fn ($r) => (array) $r, $rows);
        } catch (Throwable $e) {
            $entry['explain_analyze_error'] = $e->getMessage();
        }
    }

    return $entry;
}

if ($isMysql) {
    $result['queries'][] = captureExplain(
        'orders_by_status_count',
        'SELECT status, COUNT(*) AS c FROM orders GROUP BY status'
    );

    $result['queries'][] = captureExplain(
        'analytics_events_recent',
        'SELECT event_type, COUNT(*) AS c FROM analytics_events WHERE created_at >= ? GROUP BY event_type',
        [now()->subDays(30)->toDateTimeString()]
    );

    $result['queries'][] = captureExplain(
        'products_active_list',
        'SELECT id, name, sale_price FROM products WHERE status = ? ORDER BY created_at DESC LIMIT 20',
        ['active']
    );

    try {
        $rangeResolver = app(AnalyticsDateRangeResolver::class);
        $range = $rangeResolver->resolveFromRequest(\Illuminate\Http\Request::create('/', 'GET', ['period' => '30d']));
        $admin = app(AdminAnalyticsService::class);
        DB::enableQueryLog();
        $started = microtime(true);
        $admin->funnel($range);
        $queries = DB::getQueryLog();
        DB::disableQueryLog();
        $result['service_profiles']['admin_funnel'] = [
            'duration_ms' => round((microtime(true) - $started) * 1000, 2),
            'query_count' => count($queries),
            'total_db_time_ms' => round(array_sum(array_column($queries, 'time')), 2),
        ];
    } catch (Throwable $e) {
        $result['service_profiles']['admin_funnel'] = ['error' => $e->getMessage()];
    }

    try {
        $vendor = \App\Models\VendorAccount::query()->first();
        if ($vendor !== null) {
            $rangeResolver = app(AnalyticsDateRangeResolver::class);
            $range = $rangeResolver->resolveFromRequest(\Illuminate\Http\Request::create('/', 'GET', ['period' => '30d']));
            $vendorAnalytics = app(VendorAnalyticsService::class);
            DB::enableQueryLog();
            $started = microtime(true);
            $vendorAnalytics->overview($vendor, $range);
            $queries = DB::getQueryLog();
            DB::disableQueryLog();
            $result['service_profiles']['vendor_overview'] = [
                'duration_ms' => round((microtime(true) - $started) * 1000, 2),
                'query_count' => count($queries),
                'total_db_time_ms' => round(array_sum(array_column($queries, 'time')), 2),
            ];
        }
    } catch (Throwable $e) {
        $result['service_profiles']['vendor_overview'] = ['error' => $e->getMessage()];
    }
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
