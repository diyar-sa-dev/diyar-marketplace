<?php

declare(strict_types=1);

/**
 * Stage 28.11 — Redis / cache / queue inventory (read-only diagnostics).
 * Usage: php scripts/stage2811-redis-cache-inventory.php
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$backendRoot = dirname(__DIR__);
$inventory = [
    'timestamp_utc' => gmdate('c'),
    'environment' => [
        'app_env' => config('app.env'),
        'cache_default' => config('cache.default'),
        'cache_prefix' => config('cache.prefix'),
        'queue_default' => config('queue.default'),
        'session_driver' => config('session.driver'),
        'broadcast_connection' => config('broadcasting.default'),
        'redis_client' => config('database.redis.client'),
    ],
    'redis_checks' => [],
    'queue' => [
        'connections' => array_keys(config('queue.connections', [])),
        'default_queue' => config('queue.connections.'.config('queue.default').'.queue'),
    ],
    'jobs' => [],
    'cache_usages' => [],
    'rate_limiters' => [],
    'diyar_cache_config' => [
        'catalog' => config('diyar.catalog.cache'),
        'analytics' => config('diyar.analytics.cache'),
        'notifications' => config('diyar.notifications.cache'),
        'chat' => config('diyar.chat.cache'),
        'affiliate_dashboard_seconds' => config('diyar.affiliate.cache_dashboard_seconds'),
    ],
];

function recordCheck(array &$inventory, string $name, bool $ok, array $extra = []): void
{
    $inventory['redis_checks'][$name] = array_merge(['ok' => $ok], $extra);
}

try {
    $start = microtime(true);
    $pong = Redis::connection()->ping();
    recordCheck($inventory, 'redis_ping', $pong === true || $pong === 'PONG', [
        'latency_ms' => round((microtime(true) - $start) * 1000, 2),
    ]);
} catch (Throwable $e) {
    recordCheck($inventory, 'redis_ping', false, ['error' => $e->getMessage()]);
}

try {
    $start = microtime(true);
    $size = Queue::size();
    recordCheck($inventory, 'queue_size', true, [
        'latency_ms' => round((microtime(true) - $start) * 1000, 2),
        'size' => $size,
    ]);
} catch (Throwable $e) {
    recordCheck($inventory, 'queue_size', false, ['error' => $e->getMessage()]);
}

foreach (glob($backendRoot.'/app/Jobs/**/*.php') ?: [] as $jobFile) {
    $relative = str_replace('\\', '/', substr($jobFile, strlen($backendRoot) + 1));
    $contents = file_get_contents($jobFile) ?: '';
    $inventory['jobs'][] = [
        'file' => $relative,
        'should_queue' => str_contains($contents, 'ShouldQueue'),
        'should_be_unique' => str_contains($contents, 'ShouldBeUnique'),
        'tries' => preg_match('/public\s+int\s+\$tries\s*=\s*(\d+)/', $contents, $m) ? (int) $m[1] : null,
        'backoff' => preg_match('/public\s+array\s+\$backoff\s*=\s*\[([^\]]+)\]/', $contents, $m) ? $m[1] : null,
    ];
}

$patterns = [
    'Cache::remember' => 'Cache::remember',
    'Cache::get' => 'Cache::get',
    'Cache::put' => 'Cache::put',
    'Cache::lock' => 'Cache::lock',
    'Cache::flush' => 'Cache::flush',
    'StampedeSafeCache' => 'StampedeSafeCache::remember',
    'RateLimiter' => 'RateLimiter::',
    'dispatch(' => 'dispatch(',
];

foreach ($patterns as $label => $needle) {
    $matches = [];
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($backendRoot.'/app'));
    foreach ($iterator as $file) {
        if (! $file->isFile() || $file->getExtension() !== 'php') {
            continue;
        }
        $path = str_replace('\\', '/', $file->getPathname());
        if (str_contains($path, '/vendor/')) {
            continue;
        }
        $lines = file($path, FILE_IGNORE_NEW_LINES) ?: [];
        foreach ($lines as $lineNo => $line) {
            if (str_contains($line, $needle)) {
                $matches[] = [
                    'file' => str_replace(str_replace('\\', '/', $backendRoot).'/', '', $path),
                    'line' => $lineNo + 1,
                    'snippet' => trim($line),
                ];
            }
        }
    }
    $inventory['cache_usages'][$label] = [
        'count' => count($matches),
        'samples' => array_slice($matches, 0, 25),
    ];
}

$routeFile = $backendRoot.'/routes/api.php';
if (is_readable($routeFile)) {
    preg_match_all("/middleware\('throttle:([^']+)'\)/", file_get_contents($routeFile) ?: '', $throttles);
    $inventory['rate_limiters']['api_throttle_middleware'] = array_values(array_unique($throttles[1] ?? []));
}

$inventory['cache_flush_remaining'] = $inventory['cache_usages']['Cache::flush']['count'] ?? 0;

$allOk = collect($inventory['redis_checks'])->every(fn (array $check) => ($check['ok'] ?? false) === true);
$inventory['overall'] = $allOk ? 'PASS' : 'PARTIAL';

$outputDir = dirname(__DIR__).'/../conception/Stages/Stage 28/Phase 28.11 - Redis Cache Queue Optimization/_raw';
if (! is_dir($outputDir)) {
    mkdir($outputDir, 0777, true);
}

$outputPath = $outputDir.'/redis_cache_inventory.json';
file_put_contents($outputPath, json_encode($inventory, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL);

echo json_encode($inventory, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
exit($allOk ? 0 : 1);
