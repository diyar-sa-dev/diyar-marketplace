<?php

declare(strict_types=1);

/**
 * Stage 28.7 — HTTP endpoint profiling with Laravel query log (MySQL 8 target).
 * Usage: php scripts/stage28-performance-api-profile.php [--base-url=http://127.0.0.1:8001]
 *
 * Requires APP running against MySQL — not SQLite.
 */

use App\Models\VendorAccount;
use App\Services\Analytics\AdminAnalyticsService;
use App\Services\Analytics\AnalyticsDateRangeResolver;
use App\Services\Analytics\VendorAnalyticsService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$baseUrl = 'http://127.0.0.1:8001/api/v1';
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--base-url=')) {
        $baseUrl = rtrim(substr($arg, 11), '/');
        if (! str_ends_with($baseUrl, '/api/v1')) {
            $baseUrl .= '/api/v1';
        }
    }
}

$driver = config('database.connections.'.config('database.default').'.driver');
if ($driver === 'sqlite') {
    echo json_encode([
        'timestamp_utc' => gmdate('c'),
        'skipped' => true,
        'reason' => 'Configure MySQL 8 before API query profiling',
        'driver' => $driver,
    ], JSON_PRETTY_PRINT).PHP_EOL;
    exit(0);
}

$endpoints = [
    ['GET', '/products?per_page=12', 'catalog'],
    ['GET', '/catalog/search?q=%D9%83%D9%86%D8%A8&type=products&per_page=12', 'catalog'],
    ['GET', '/categories', 'catalog'],
    ['GET', '/admin/analytics/funnel?period=30d', 'analytics', 'admin'],
];

function profileHttp(string $method, string $url, ?array $headers = null): array
{
    DB::flushQueryLog();
    DB::enableQueryLog();
    $started = microtime(true);
    try {
        $request = Http::withHeaders($headers ?? ['Accept' => 'application/json', 'X-Forwarded-For' => '10.99.0.1'])
            ->timeout(60);
        $response = $method === 'GET' ? $request->get($url) : $request->post($url);
        $queries = DB::getQueryLog();
        $times = array_column($queries, 'time');

        return [
            'status' => $response->status(),
            'duration_ms' => round((microtime(true) - $started) * 1000, 2),
            'payload_bytes' => strlen($response->body()),
            'query_count' => count($queries),
            'total_db_time_ms' => round(array_sum($times), 2),
            'success' => $response->successful(),
        ];
    } catch (Throwable $e) {
        return [
            'status' => null,
            'error' => $e->getMessage(),
            'query_count' => count(DB::getQueryLog()),
        ];
    } finally {
        DB::disableQueryLog();
    }
}

$result = [
    'timestamp_utc' => gmdate('c'),
    'database' => config('database.connections.'.config('database.default').'.database'),
    'engine' => DB::selectOne('SELECT VERSION() AS v')?->v ?? null,
    'base_url' => $baseUrl,
    'endpoints' => [],
    'service_profiles' => [],
];

foreach ($endpoints as $item) {
    [$method, $path, $group] = $item;
    $result['endpoints'][$path] = array_merge(
        ['method' => $method, 'group' => $group],
        profileHttp($method, str_replace('/api/v1', $baseUrl, $path) === $path ? $baseUrl.$path : $baseUrl.$path)
    );
}

try {
    $rangeResolver = app(AnalyticsDateRangeResolver::class);
    $range = $rangeResolver->resolve(['period' => '30d']);
    $admin = app(AdminAnalyticsService::class);
    foreach (['funnel' => fn () => $admin->funnel($range), 'cohorts' => fn () => $admin->cohorts(6)] as $name => $fn) {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $started = microtime(true);
        $fn();
        $queries = DB::getQueryLog();
        DB::disableQueryLog();
        $result['service_profiles']['admin_'.$name] = [
            'duration_ms' => round((microtime(true) - $started) * 1000, 2),
            'query_count' => count($queries),
            'total_db_time_ms' => round(array_sum(array_column($queries, 'time')), 2),
        ];
    }

    $vendor = VendorAccount::query()->first();
    if ($vendor !== null) {
        $vendorAnalytics = app(VendorAnalyticsService::class);
        DB::flushQueryLog();
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
    $result['service_profiles_error'] = $e->getMessage();
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
