<?php

declare(strict_types=1);

/**
 * Phase 7 — EXPLAIN / EXPLAIN ANALYZE for Phase 2 aggregate queries.
 *
 * Requires MySQL/MariaDB. Exits with code 2 on SQLite or unsupported drivers.
 *
 * Usage:
 *   php scripts/certification/filter-suggestions-explain-analyze.php
 *   php scripts/certification/filter-suggestions-explain-analyze.php --context=products:bedroom
 */

use App\Services\Catalog\FilterContextSummaryService;
use App\Support\Catalog\Filters\CatalogFilterNormalizer;
use App\Support\Catalog\Filters\Context\FilterContextFactory;
use App\Support\Catalog\Filters\FilterContentType;
use App\Support\Catalog\Filters\FilterSurface;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$driver = config('database.default');
$connection = config("database.connections.{$driver}.driver");

if (! in_array($connection, ['mysql', 'mariadb'], true)) {
    fwrite(STDERR, json_encode([
        'ok' => false,
        'reason' => 'unsupported_driver',
        'driver' => $connection,
        'message' => 'EXPLAIN ANALYZE requires MySQL/MariaDB. Run against staging/production-like DB.',
    ], JSON_PRETTY_PRINT).PHP_EOL);

    exit(2);
}

try {
    DB::connection()->getPdo();
} catch (Throwable $exception) {
    fwrite(STDERR, json_encode([
        'ok' => false,
        'reason' => 'database_unreachable',
        'driver' => $connection,
        'message' => $exception->getMessage(),
    ], JSON_PRETTY_PRINT).PHP_EOL);

    exit(2);
}

$contexts = [
    ['type' => 'products', 'category_slug' => 'bedroom'],
    ['type' => 'products', 'category_slug' => 'office'],
    ['type' => 'services', 'category' => 'interior-design'],
];

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--context=')) {
        [$type, $slug] = array_pad(explode(':', substr($arg, 10), 2), 2, null);
        $contexts = [[
            'type' => $type,
            ...($type === 'products' ? ['category_slug' => $slug] : ['category' => $slug]),
        ]];
    }
}

$supportsAnalyze = true;

try {
    DB::select('EXPLAIN ANALYZE SELECT 1');
} catch (Throwable) {
    $supportsAnalyze = false;
}

$captured = [];

DB::listen(function ($query) use (&$captured, $supportsAnalyze): void {
    if (preg_match('/^\s*EXPLAIN(\s+ANALYZE)?\s/i', $query->sql) === 1) {
        return;
    }

    $fingerprint = md5($query->sql);

    if (isset($captured[$fingerprint])) {
        return;
    }

    $plan = ['type' => 'EXPLAIN', 'rows' => DB::select('EXPLAIN '.$query->sql, $query->bindings)];

    if ($supportsAnalyze) {
        try {
            $plan['analyze'] = DB::select('EXPLAIN ANALYZE '.$query->sql, $query->bindings);
        } catch (Throwable $exception) {
            $plan['analyze_error'] = $exception->getMessage();
        }
    }

    $captured[$fingerprint] = [
        'sql' => $query->sql,
        'bindings_count' => count($query->bindings),
        'plan' => $plan,
    ];
});

$normalizer = app(CatalogFilterNormalizer::class);
$summaryService = app(FilterContextSummaryService::class);

foreach ($contexts as $raw) {
    $normalized = $normalizer->normalizeForCatalogSearch($raw);
    $contentType = ($raw['type'] ?? 'products') === 'services'
        ? FilterContentType::Service
        : FilterContentType::Product;

    $engineFilters = $contentType === FilterContentType::Service
        ? $normalizer->serviceEngineFilters($normalized)
        : $normalizer->productEngineFilters($normalized);

    $context = FilterContextFactory::fromEngineFilters(
        $contentType,
        FilterSurface::CatalogSearch,
        $engineFilters,
    );

    $summaryService->summarize($context, $engineFilters);
}

echo json_encode([
    'timestamp_utc' => gmdate('c'),
    'driver' => $connection,
    'supports_explain_analyze' => $supportsAnalyze,
    'query_count' => count($captured),
    'queries' => array_values($captured),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
