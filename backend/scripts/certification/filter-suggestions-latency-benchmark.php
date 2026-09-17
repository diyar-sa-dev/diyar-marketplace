<?php

declare(strict_types=1);

/**
 * Phase 7 — Filter suggestion latency benchmark.
 *
 * Measures p50/p95/p99 for cache hit, cache miss, and resolution paths.
 * Requires a bootstrapped Laravel app with real catalog data.
 *
 * Usage:
 *   php scripts/certification/filter-suggestions-latency-benchmark.php
 *   php scripts/certification/filter-suggestions-latency-benchmark.php --iterations=50 --warmup=5
 *   php scripts/certification/filter-suggestions-latency-benchmark.php --context=products:bedroom
 *   php scripts/certification/filter-suggestions-latency-benchmark.php --context=services:interior-design
 */

use App\Services\Catalog\CachedFilterSuggestionService;
use App\Support\Catalog\Filters\CatalogFilterNormalizer;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

try {
    DB::connection()->getPdo();
} catch (Throwable $exception) {
    fwrite(STDERR, json_encode([
        'ok' => false,
        'reason' => 'database_unreachable',
        'driver' => config('database.default'),
        'message' => $exception->getMessage(),
    ], JSON_PRETTY_PRINT).PHP_EOL);
    exit(2);
}

$iterations = 30;
$warmup = 3;
$contexts = [
    ['type' => 'products', 'category_slug' => 'bedroom'],
    ['type' => 'services', 'category' => 'interior-design'],
];

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--iterations=')) {
        $iterations = max(5, (int) substr($arg, 13));
    }
    if (str_starts_with($arg, '--warmup=')) {
        $warmup = max(0, (int) substr($arg, 9));
    }
    if (str_starts_with($arg, '--context=')) {
        [$type, $slug] = array_pad(explode(':', substr($arg, 10), 2), 2, null);
        $contexts = [[
            'type' => $type,
            ...($type === 'products' ? ['category_slug' => $slug] : ['category' => $slug]),
        ]];
    }
}

function percentile(array $samples, float $p): float
{
    sort($samples);
    $index = (int) floor((count($samples) - 1) * $p);

    return $samples[$index] ?? 0.0;
}

function benchmarkContext(array $rawFilters, int $warmup, int $iterations): array
{
    $normalizer = app(CatalogFilterNormalizer::class);
    $filters = $normalizer->normalizeForCatalogSearch($rawFilters);
    $service = app(CachedFilterSuggestionService::class);

    Cache::flush();

    for ($i = 0; $i < $warmup; $i++) {
        $service->suggestCatalogSearch($filters, 'en');
    }

    $missSamples = [];
    $missDbQueries = [];

    Cache::flush();

    for ($i = 0; $i < $iterations; $i++) {
        Cache::flush();
        DB::flushQueryLog();
        DB::enableQueryLog();
        $started = hrtime(true);
        $service->suggestCatalogSearch($filters, 'en');
        $missSamples[] = (hrtime(true) - $started) / 1_000_000;
        $missDbQueries[] = count(DB::getQueryLog());
        DB::disableQueryLog();
    }

    $service->suggestCatalogSearch($filters, 'en');

    $hitSamples = [];
    $hitDbQueries = [];

    for ($i = 0; $i < $iterations; $i++) {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $started = hrtime(true);
        $result = $service->suggestCatalogSearch($filters, 'en');
        $hitSamples[] = (hrtime(true) - $started) / 1_000_000;
        $hitDbQueries[] = count(DB::getQueryLog());
        DB::disableQueryLog();
    }

    $sectionKey = ($rawFilters['type'] ?? 'products') === 'services' ? 'services' : 'products';
    $resolutionPath = $result[$sectionKey]->resolutionPath ?? null;

    return [
        'context' => $rawFilters,
        'driver' => config('database.default'),
        'resolution_path_sample' => $resolutionPath,
        'cache_miss' => [
            'samples' => count($missSamples),
            'db_queries_avg' => round(array_sum($missDbQueries) / max(1, count($missDbQueries)), 2),
            'p50_ms' => round(percentile($missSamples, 0.50), 2),
            'p95_ms' => round(percentile($missSamples, 0.95), 2),
            'p99_ms' => round(percentile($missSamples, 0.99), 2),
            'max_ms' => round(max($missSamples), 2),
        ],
        'cache_hit' => [
            'samples' => count($hitSamples),
            'db_queries_avg' => round(array_sum($hitDbQueries) / max(1, count($hitDbQueries)), 2),
            'p50_ms' => round(percentile($hitSamples, 0.50), 2),
            'p95_ms' => round(percentile($hitSamples, 0.95), 2),
            'p99_ms' => round(percentile($hitSamples, 0.99), 2),
            'max_ms' => round(max($hitSamples), 2),
        ],
    ];
}

$report = [
    'timestamp_utc' => gmdate('c'),
    'iterations' => $iterations,
    'warmup' => $warmup,
    'targets' => [
        'cache_hit_p95_ms' => 50,
        'cache_miss_p95_ms' => 250,
    ],
    'contexts' => [],
];

foreach ($contexts as $context) {
    $report['contexts'][] = benchmarkContext($context, $warmup, $iterations);
}

echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
