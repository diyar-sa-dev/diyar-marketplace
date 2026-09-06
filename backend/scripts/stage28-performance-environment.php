<?php

declare(strict_types=1);

/**
 * Stage 28.7 — Capture performance test environment metadata.
 * Usage: php scripts/stage28-performance-environment.php [--base-url=http://127.0.0.1:8000]
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$baseUrl = 'http://127.0.0.1:8000';
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--base-url=')) {
        $baseUrl = rtrim(substr($arg, 11), '/');
    }
}

function safe(callable $fn, mixed $default = null): mixed
{
    try {
        return $fn();
    } catch (Throwable) {
        return $default;
    }
}

$dbVersion = safe(fn () => DB::selectOne('SELECT VERSION() AS v')?->v);
$redisInfo = safe(function () {
    $raw = Redis::connection()->info();
    if (! is_array($raw)) {
        return null;
    }

    return [
        'version' => $raw['redis_version'] ?? null,
        'used_memory_human' => $raw['used_memory_human'] ?? null,
        'connected_clients' => $raw['connected_clients'] ?? null,
    ];
});

$healthMs = null;
$healthStatus = null;
$healthStart = microtime(true);
try {
    $ctx = stream_context_create(['http' => ['timeout' => 10, 'ignore_errors' => true]]);
    $body = @file_get_contents($baseUrl.'/api/v1/health', false, $ctx);
    $healthMs = round((microtime(true) - $healthStart) * 1000, 2);
    if ($body !== false) {
        $decoded = json_decode($body, true);
        $healthStatus = $decoded['data']['status'] ?? ($decoded['success'] ?? null);
    }
} catch (Throwable) {
    $healthMs = round((microtime(true) - $healthStart) * 1000, 2);
}

$result = [
    'timestamp_utc' => gmdate('c'),
    'hostname' => gethostname() ?: php_uname('n'),
    'os' => PHP_OS_FAMILY,
    'php_version' => PHP_VERSION,
    'laravel_version' => app()->version(),
    'app_env' => config('app.env'),
    'app_debug' => config('app.debug'),
    'base_url' => $baseUrl,
    'database' => [
        'connection' => config('database.default'),
        'driver' => config('database.connections.'.config('database.default').'.driver'),
        'host' => config('database.connections.'.config('database.default').'.host'),
        'database' => config('database.connections.'.config('database.default').'.database'),
        'version' => $dbVersion,
        'is_mysql8' => is_string($dbVersion) && str_contains(strtolower($dbVersion), 'mysql') && version_compare(preg_replace('/[^0-9.].*$/', '', $dbVersion) ?: '0', '8.0', '>='),
        'is_mariadb' => is_string($dbVersion) && stripos($dbVersion, 'mariadb') !== false,
        'is_sqlite' => config('database.connections.'.config('database.default').'.driver') === 'sqlite',
    ],
    'redis' => [
        'cache_store' => config('cache.default'),
        'queue_connection' => config('queue.default'),
        'session_driver' => config('session.driver'),
        'info' => $redisInfo,
    ],
    'loadtest_mode' => config('diyar.loadtest.enabled'),
    'health_probe' => [
        'latency_ms' => $healthMs,
        'status' => $healthStatus,
    ],
    'note' => 'SQLite and MariaDB measurements must not be labeled as MySQL 8 production performance.',
];

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
