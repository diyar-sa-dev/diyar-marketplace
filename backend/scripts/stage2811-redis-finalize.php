<?php

declare(strict_types=1);

/**
 * Phase 28.11 — Redis / cache / queue finalization (Laravel runtime verification).
 * Usage: php scripts/stage2811-redis-finalize.php [--output=path.json]
 *
 * Requires CACHE_STORE=redis, QUEUE_CONNECTION=redis, reachable REDIS_HOST.
 */

use App\Support\Cache\CacheKeys;
use App\Support\Cache\StampedeSafeCache;
use App\Support\Cache\VersionedCache;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Redis;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$outputPath = null;
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--output=')) {
        $outputPath = substr($arg, 9);
    }
}

$report = [
    'timestamp_utc' => gmdate('c'),
    'environment' => [
        'app_env' => config('app.env'),
        'cache_store' => config('cache.default'),
        'queue_connection' => config('queue.default'),
        'session_driver' => config('session.driver'),
        'redis_host' => config('database.redis.default.host'),
        'redis_port' => config('database.redis.default.port'),
        'redis_cache_db' => config('database.redis.cache.database'),
        'redis_default_db' => config('database.redis.default.database'),
        'cache_prefix' => config('cache.prefix'),
    ],
    'checks' => [],
    'benchmark' => null,
    'stampede' => null,
    'overall' => 'FAIL',
];

function check(array &$report, string $name, bool $ok, array $extra = []): void
{
    $report['checks'][$name] = array_merge(['ok' => $ok], $extra);
}

// 1. Connectivity
try {
    $start = microtime(true);
    $pong = Redis::connection()->ping();
    check($report, 'redis_ping', $pong === true || $pong === 'PONG', [
        'latency_ms' => round((microtime(true) - $start) * 1000, 2),
    ]);
} catch (Throwable $e) {
    check($report, 'redis_ping', false, ['error' => $e->getMessage()]);
}

// 2. Laravel cache roundtrip
try {
    $key = 'stage2811:finalize:'.bin2hex(random_bytes(4));
    $start = microtime(true);
    Cache::store('redis')->put($key, ['ok' => true], 30);
    $val = Cache::store('redis')->get($key);
    Cache::store('redis')->forget($key);
    check($report, 'laravel_cache_redis', ($val['ok'] ?? false) === true, [
        'latency_ms' => round((microtime(true) - $start) * 1000, 2),
    ]);
} catch (Throwable $e) {
    check($report, 'laravel_cache_redis', false, ['error' => $e->getMessage()]);
}

// 3. Version bump atomicity
try {
    $vKey = 'stage2811:version:test:'.bin2hex(random_bytes(3));
    Cache::forever($vKey, 0);
    $a = VersionedCache::bump($vKey);
    $b = VersionedCache::bump($vKey);
    Redis::connection()->del(config('cache.prefix').$vKey);
    check($report, 'versioned_cache_increment', $a === 1 && $b === 2);
} catch (Throwable $e) {
    check($report, 'versioned_cache_increment', false, ['error' => $e->getMessage()]);
}

// 4. Lock acquire/release
try {
    $lock = Cache::lock('stage2811:lock:'.bin2hex(random_bytes(3)), 5);
    $acquired = $lock->get();
    $lock->release();
    check($report, 'cache_lock', $acquired === true);
} catch (Throwable $e) {
    check($report, 'cache_lock', false, ['error' => $e->getMessage()]);
}

// 5. Queue dispatch + worker
$queueToken = 'stage2811:queue:'.bin2hex(random_bytes(4));
try {
    dispatch(function () use ($queueToken): void {
        Cache::store('redis')->put($queueToken, 'processed', 120);
    })->onConnection('redis');

    $exitCode = Artisan::call('queue:work', [
        'connection' => 'redis',
        '--once' => true,
        '--stop-when-empty' => true,
    ]);
    $marker = Cache::store('redis')->get($queueToken);
    Cache::store('redis')->forget($queueToken);
    check($report, 'queue_dispatch_worker', $exitCode === 0 && $marker === 'processed', [
        'exit_code' => $exitCode,
    ]);
} catch (Throwable $e) {
    check($report, 'queue_dispatch_worker', false, ['error' => $e->getMessage()]);
}

// 6. Rate limiter (Redis-backed when cache is redis)
try {
    $rlKey = 'stage2811:rl:'.bin2hex(random_bytes(4));
    RateLimiter::clear($rlKey);
    $hits = 0;
    for ($i = 0; $i < 5; $i++) {
        if (! RateLimiter::tooManyAttempts($rlKey, 3)) {
            RateLimiter::hit($rlKey, 60);
            $hits++;
        }
    }
    $blocked = RateLimiter::tooManyAttempts($rlKey, 3);
    RateLimiter::clear($rlKey);
    check($report, 'rate_limiter', $hits === 3 && $blocked === true, [
        'hits_before_block' => $hits,
    ]);
} catch (Throwable $e) {
    check($report, 'rate_limiter', false, ['error' => $e->getMessage()]);
}

// 7. Stampede single-flight (sequential cold/warm)
try {
    $stampedeKey = 'stage2811:stampede:'.bin2hex(random_bytes(4));
    $calls = 0;
    $compute = function () use (&$calls) {
        $calls++;

        return ['n' => $calls];
    };
    $first = StampedeSafeCache::remember($stampedeKey, 60, $compute);
    $second = StampedeSafeCache::remember($stampedeKey, 60, $compute);
    Cache::forget($stampedeKey);
    check($report, 'stampede_safe_cache', $calls === 1 && $first === $second && $first['n'] === 1);
} catch (Throwable $e) {
    check($report, 'stampede_safe_cache', false, ['error' => $e->getMessage()]);
}

// 8. Admin permission key uses string UUID shape (not int 0)
try {
    $sampleUuid = '550e8400-e29b-41d4-a716-446655440000';
    $key = CacheKeys::adminPermissions($sampleUuid, 1);
    check($report, 'admin_permission_key_uuid', str_contains($key, $sampleUuid) && ! str_contains($key, ':0:1'));
} catch (Throwable $e) {
    check($report, 'admin_permission_key_uuid', false, ['error' => $e->getMessage()]);
}

// 9. No Cache::flush in app (static grep count passed separately)
check($report, 'config_uses_redis', config('cache.default') === 'redis' && config('queue.default') === 'redis');

// Benchmark subset
$samples = [];
for ($i = 0; $i < 30; $i++) {
    $start = microtime(true);
    Cache::store('redis')->get('stage2811:bench:missing');
    $samples[] = (microtime(true) - $start) * 1000;
}
sort($samples);
$n = count($samples);
$report['benchmark'] = [
    'cache_miss_get_ms' => [
        'median' => round($samples[(int) floor(($n - 1) / 2)], 2),
        'p95' => round($samples[(int) ceil(0.95 * $n) - 1], 2),
        'samples' => $n,
    ],
];

try {
    $info = Redis::connection()->info('server');
    $report['redis_server'] = [
        'version' => $info['redis_version'] ?? null,
    ];
} catch (Throwable) {
    $report['redis_server'] = ['version' => null];
}

$allOk = collect($report['checks'])->every(fn (array $c) => ($c['ok'] ?? false) === true);
$report['overall'] = $allOk ? 'PASS' : 'FAIL';

$json = json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
echo $json;

if ($outputPath !== null) {
    file_put_contents($outputPath, $json);
}

exit($allOk ? 0 : 1);
