<?php

declare(strict_types=1);

/**
 * Stage 28.1 — Redis latency benchmark (cold vs warm, multiple samples).
 * Usage: php scripts/stage28-redis-benchmark.php [--iterations=10]
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$iterations = 10;
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--iterations=')) {
        $iterations = max(1, (int) substr($arg, 13));
    }
}

function stats(array $samples): array
{
    sort($samples);
    $n = count($samples);
    if ($n === 0) {
        return ['min' => null, 'median' => null, 'p95' => null, 'max' => null, 'samples' => 0];
    }

    $p95Index = (int) ceil(0.95 * $n) - 1;
    $medianIndex = (int) floor(($n - 1) / 2);

    return [
        'min' => round($samples[0], 2),
        'median' => round($samples[$medianIndex], 2),
        'p95' => round($samples[min($p95Index, $n - 1)], 2),
        'max' => round($samples[$n - 1], 2),
        'samples' => $n,
    ];
}

function measure(callable $fn): float
{
    $start = microtime(true);
    $fn();

    return (microtime(true) - $start) * 1000;
}

$results = [
    'timestamp_utc' => gmdate('c'),
    'iterations' => $iterations,
    'note' => 'First sample in each series includes Laravel bootstrap (already loaded). Raw ping after bootstrap reflects warm PHP process.',
    'series' => [],
];

// Cold-ish: first ping after script bootstrap
$results['series']['redis_ping_first_after_bootstrap_ms'] = measure(fn () => Redis::connection()->ping());

$pingSamples = [];
$rawSamples = [];
$cacheSamples = [];
$queueSamples = [];

for ($i = 0; $i < $iterations; $i++) {
    $pingSamples[] = measure(fn () => Redis::connection()->ping());

    $rawSamples[] = measure(function (): void {
        $key = 'stage28:bench:'.bin2hex(random_bytes(3));
        Redis::connection()->set($key, '1');
        Redis::connection()->get($key);
        Redis::connection()->del($key);
    });

    $cacheSamples[] = measure(function (): void {
        $key = 'stage28:cache:'.bin2hex(random_bytes(3));
        Cache::store('redis')->put($key, 'x', 30);
        Cache::store('redis')->get($key);
        Cache::store('redis')->forget($key);
    });

    $queueSamples[] = measure(fn () => Queue::connection('redis')->size());
}

$results['series']['redis_ping_warm_ms'] = stats($pingSamples);
$results['series']['redis_raw_set_get_del_ms'] = stats($rawSamples);
$results['series']['laravel_cache_roundtrip_ms'] = stats($cacheSamples);
$results['series']['laravel_queue_size_ms'] = stats($queueSamples);

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
