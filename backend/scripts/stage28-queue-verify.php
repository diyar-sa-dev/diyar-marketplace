<?php

declare(strict_types=1);

/**
 * Stage 28 — Queue worker verification (dispatches + processes one job).
 * Usage: php scripts/stage28-queue-verify.php
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$token = 'stage28:queue:'.bin2hex(random_bytes(4));
$results = [
    'timestamp_utc' => gmdate('c'),
    'queue_connection' => config('queue.default'),
    'checks' => [],
];

try {
    $dispatchStart = microtime(true);
    dispatch(function () use ($token): void {
        Cache::store('redis')->put($token, 'processed', 120);
    })->onConnection('redis');
    $results['checks']['dispatch'] = [
        'ok' => true,
        'latency_ms' => round((microtime(true) - $dispatchStart) * 1000, 2),
    ];
} catch (Throwable $e) {
    $results['checks']['dispatch'] = ['ok' => false, 'error' => $e->getMessage()];
    echo json_encode($results, JSON_PRETTY_PRINT).PHP_EOL;
    exit(1);
}

$beforeSize = Queue::connection('redis')->size();
$workerStart = microtime(true);
$exitCode = Artisan::call('queue:work', [
    'connection' => 'redis',
    '--once' => true,
    '--stop-when-empty' => true,
]);
$workerMs = round((microtime(true) - $workerStart) * 1000, 2);

$processed = Cache::store('redis')->get($token);
Cache::store('redis')->forget($token);

$results['checks']['worker_once'] = [
    'ok' => $exitCode === 0 && $processed === 'processed',
    'exit_code' => $exitCode,
    'latency_ms' => $workerMs,
    'queue_size_before' => $beforeSize,
    'processed_marker' => $processed,
];

try {
    $failedCount = (int) Redis::connection()->llen('queues:default:failed');
} catch (Throwable) {
    $failedCount = null;
}

$results['failed_jobs_table'] = [
    'count' => DB::table('failed_jobs')->count(),
];

$allOk = collect($results['checks'])->every(fn (array $c) => ($c['ok'] ?? false) === true);
$results['overall'] = $allOk ? 'PASS' : 'FAIL';

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
exit($allOk ? 0 : 1);
