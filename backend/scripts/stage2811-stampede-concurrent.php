<?php

declare(strict_types=1);

/**
 * Phase 28.11 — Concurrent stampede verification (multi-process).
 * Usage: php scripts/stage2811-stampede-concurrent.php [--workers=20]
 */

use App\Support\Cache\StampedeSafeCache;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Cache;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$workers = 20;
$workerMode = false;
$sharedKey = 'stage2811:stampede:shared';
$counterKey = 'stage2811:stampede:counter';

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--workers=')) {
        $workers = max(2, min(100, (int) substr($arg, 10)));
    }
    if ($arg === '--worker') {
        $workerMode = true;
    }
    if (str_starts_with($arg, '--key=')) {
        $sharedKey = substr($arg, 6);
    }
    if (str_starts_with($arg, '--counter=')) {
        $counterKey = substr($arg, 10);
    }
}

if ($workerMode) {
    usleep(random_int(0, 50_000));
    StampedeSafeCache::remember($sharedKey, 30, function () use ($counterKey) {
        $current = (int) Cache::get($counterKey, 0);
        usleep(50_000);
        Cache::put($counterKey, $current + 1, 60);

        return ['computed_at' => microtime(true)];
    });
    exit(0);
}

Cache::forget($sharedKey);
Cache::forget($counterKey);

$php = PHP_BINARY;
$script = __FILE__;
$processes = [];

for ($i = 0; $i < $workers; $i++) {
    $args = escapeshellarg($php).' '.escapeshellarg($script)
        .' --worker'
        .' --key='.escapeshellarg($sharedKey)
        .' --counter='.escapeshellarg($counterKey);
    $descriptors = [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
    $processes[] = proc_open($args, $descriptors, $pipes, dirname(__DIR__, 2));
}

$failures = 0;
foreach ($processes as $proc) {
    if (! is_resource($proc)) {
        $failures++;

        continue;
    }
    $code = proc_close($proc);
    if ($code !== 0) {
        $failures++;
    }
}

$computeCount = (int) Cache::get($counterKey, 0);
Cache::forget($sharedKey);
Cache::forget($counterKey);

$result = [
    'timestamp_utc' => gmdate('c'),
    'workers' => $workers,
    'compute_count' => $computeCount,
    'process_failures' => $failures,
    'ok' => $computeCount >= 1 && $computeCount <= 3 && $failures === 0,
    'note' => 'compute_count should be 1-3 (lock timeout may allow limited duplicate compute)',
];

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
exit($result['ok'] ? 0 : 1);
