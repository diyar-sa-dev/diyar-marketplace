<?php

declare(strict_types=1);

/**
 * Stage 28 — Redis verification script (read-only diagnostics).
 * Usage: php scripts/stage28-redis-verify.php
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$results = [
    'timestamp_utc' => gmdate('c'),
    'config' => [
        'cache_store' => config('cache.default'),
        'queue_connection' => config('queue.default'),
        'session_driver' => config('session.driver'),
        'redis_client' => config('database.redis.client'),
        'redis_host' => config('database.redis.default.host'),
        'redis_port' => config('database.redis.default.port'),
    ],
    'checks' => [],
];

function record(array &$results, string $name, bool $ok, array $extra = []): void
{
    $results['checks'][$name] = array_merge(['ok' => $ok], $extra);
}

try {
    $start = microtime(true);
    $pong = Redis::connection()->ping();
    record($results, 'redis_ping', $pong === true || $pong === 'PONG', [
        'latency_ms' => round((microtime(true) - $start) * 1000, 2),
        'response' => $pong,
    ]);
} catch (Throwable $e) {
    record($results, 'redis_ping', false, ['error' => $e->getMessage()]);
}

try {
    $key = 'stage28:verify:'.bin2hex(random_bytes(4));
    $start = microtime(true);
    Redis::connection()->set($key, '1');
    $get = Redis::connection()->get($key);
    Redis::connection()->del($key);
    Redis::connection()->setex($key, 10, 'ttl-test');
    $ttl = Redis::connection()->ttl($key);
    Redis::connection()->del($key);
    record($results, 'redis_raw_set_get_delete_ttl', $get === '1' && $ttl > 0, [
        'latency_ms' => round((microtime(true) - $start) * 1000, 2),
        'ttl_seconds' => $ttl,
    ]);
} catch (Throwable $e) {
    record($results, 'redis_raw_set_get_delete_ttl', false, ['error' => $e->getMessage()]);
}

try {
    $key = 'stage28:cache:'.bin2hex(random_bytes(4));
    $start = microtime(true);
    Cache::store('redis')->put($key, 'cache-ok', 60);
    $value = Cache::store('redis')->get($key);
    Cache::store('redis')->forget($key);
    record($results, 'laravel_cache_redis', $value === 'cache-ok', [
        'latency_ms' => round((microtime(true) - $start) * 1000, 2),
    ]);
} catch (Throwable $e) {
    record($results, 'laravel_cache_redis', false, ['error' => $e->getMessage()]);
}

try {
    $start = microtime(true);
    $size = Queue::size();
    record($results, 'laravel_queue_redis_connection', true, [
        'latency_ms' => round((microtime(true) - $start) * 1000, 2),
        'queue_size' => $size,
        'queue_name' => config('queue.connections.redis.queue', 'default'),
    ]);
} catch (Throwable $e) {
    record($results, 'laravel_queue_redis_connection', false, ['error' => $e->getMessage()]);
}

try {
    $info = Redis::connection()->info('server');
    $results['redis_server'] = [
        'redis_version' => $info['redis_version'] ?? null,
        'os' => $info['os'] ?? null,
    ];
} catch (Throwable $e) {
    $results['redis_server'] = ['error' => $e->getMessage()];
}

$results['php'] = [
    'version' => PHP_VERSION,
    'redis_extension' => extension_loaded('redis'),
    'redis_extension_version' => phpversion('redis') ?: null,
];

$allOk = collect($results['checks'])->every(fn (array $check) => ($check['ok'] ?? false) === true);
$results['overall'] = $allOk ? 'PASS' : 'FAIL';

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
exit($allOk ? 0 : 1);
