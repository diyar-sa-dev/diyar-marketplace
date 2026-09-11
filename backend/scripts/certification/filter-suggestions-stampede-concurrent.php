<?php

declare(strict_types=1);

/**
 * Phase 7 — Concurrent cold-cache stampede test for filter suggestions.
 *
 * Verifies StampedeSafeCache limits expensive regeneration under concurrent load.
 *
 * Usage:
 *   php scripts/certification/filter-suggestions-stampede-concurrent.php --workers=50
 *   php scripts/certification/filter-suggestions-stampede-concurrent.php --workers=100 --context=products:bedroom
 */

use App\Services\Catalog\CachedFilterSuggestionService;
use App\Support\Catalog\Filters\CatalogFilterNormalizer;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$workers = 50;
$workerMode = false;
$counterKey = 'cert:filter-suggestions:stampede:counter';
$rawFilters = ['type' => 'products', 'category_slug' => 'bedroom'];

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--workers=')) {
        $workers = max(2, min(100, (int) substr($arg, 10)));
    }
    if ($arg === '--worker') {
        $workerMode = true;
    }
    if (str_starts_with($arg, '--context=')) {
        [$type, $slug] = array_pad(explode(':', substr($arg, 10), 2), 2, null);
        $rawFilters = [
            'type' => $type,
            ...($type === 'products' ? ['category_slug' => $slug] : ['category' => $slug]),
        ];
    }
}

$filters = app(CatalogFilterNormalizer::class)->normalizeForCatalogSearch($rawFilters);

if ($workerMode) {
    usleep(random_int(0, 50_000));

    DB::listen(function () use ($counterKey): void {
        $current = (int) Cache::get($counterKey, 0);
        Cache::put($counterKey, $current + 1, 120);
    });

    app(CachedFilterSuggestionService::class)->suggestCatalogSearch($filters, 'en');
    exit(0);
}

Cache::flush();
Cache::forget($counterKey);

$php = PHP_BINARY;
$script = __FILE__;
$contextArg = '--context='.($rawFilters['type'] ?? 'products').':'.($rawFilters['category_slug'] ?? $rawFilters['category'] ?? 'bedroom');
$processes = [];

for ($i = 0; $i < $workers; $i++) {
    $args = escapeshellarg($php).' '.escapeshellarg($script).' --worker '.$contextArg;
    $descriptors = [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
    $processes[] = proc_open($args, $descriptors, $pipes, dirname(__DIR__, 2));
}

$failures = 0;
foreach ($processes as $proc) {
    if (! is_resource($proc)) {
        $failures++;
        continue;
    }
    if (proc_close($proc) !== 0) {
        $failures++;
    }
}

$dbQueryEvents = (int) Cache::get($counterKey, 0);
Cache::forget($counterKey);

$result = [
    'timestamp_utc' => gmdate('c'),
    'workers' => $workers,
    'context' => $rawFilters,
    'db_query_events' => $dbQueryEvents,
    'process_failures' => $failures,
    'expected_max_db_amplification' => max(3, (int) ceil($workers * 0.1)),
    'ok' => $failures === 0 && $dbQueryEvents <= max(6 * 3, (int) ceil($workers * 0.15)),
    'note' => 'db_query_events counts DB listener firings during cold-cache regeneration; should stay far below workers × 6',
];

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
exit($result['ok'] ? 0 : 1);
