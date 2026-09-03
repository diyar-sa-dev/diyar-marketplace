<?php

declare(strict_types=1);

/**
 * Phase 28.10 — API performance profile (query count + timing smoke).
 * Usage: php scripts/stage2810-api-performance-profile.php [--output-dir=path]
 *
 * Requires SQLite or MySQL; uses in-memory/sqlite by default from phpunit env when unset.
 */

use App\Services\Catalog\CatalogSearchService;
use App\Services\Catalog\ProductService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

require __DIR__.'/../vendor/autoload.php';

$outputDir = dirname(__DIR__, 2).'/conception/Stages/Stage 28/Phase 28.10 - Backend API Optimization';
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--output-dir=')) {
        $outputDir = substr($arg, 13);
    }
}

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (! app()->environment('testing', 'local')) {
    fwrite(STDERR, "Run in testing/local only.\n");
    exit(1);
}

function countQueries(callable $callback): array
{
    $queries = [];
    DB::listen(function ($query) use (&$queries) {
        $queries[] = [
            'sql' => $query->sql,
            'time_ms' => $query->time,
        ];
    });

    $start = microtime(true);
    $callback();
    $durationMs = round((microtime(true) - $start) * 1000, 3);

    return [
        'query_count' => count($queries),
        'duration_ms' => $durationMs,
        'queries' => array_slice($queries, 0, 50),
    ];
}

$result = [
    'timestamp_utc' => gmdate('c'),
    'engine' => config('database.default'),
    'database' => config('database.connections.'.config('database.default').'.database'),
    'profiles' => [],
];

// Seed minimal data if empty
try {
    if (DB::table('products')->count() === 0) {
        Artisan::call('migrate:fresh', ['--seed' => true, '--force' => true]);
    }
} catch (Throwable $e) {
    $result['seed_error'] = $e->getMessage();
}

$profiles = [
    'products_list' => fn () => app(ProductService::class)
        ->listPublic(['per_page' => 8]),
    'catalog_search' => fn () => app(CatalogSearchService::class)
        ->search(['q' => 'chair', 'type' => 'products', 'per_page' => 8]),
];

foreach ($profiles as $name => $fn) {
    try {
        $result['profiles'][$name] = countQueries($fn);
    } catch (Throwable $e) {
        $result['profiles'][$name] = ['error' => $e->getMessage()];
    }
}

File::ensureDirectoryExists($outputDir);
$outFile = $outputDir.'/_api_performance_after.json';
File::put($outFile, json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

echo json_encode([
    'written' => $outFile,
    'profiles' => collect($result['profiles'])->map(fn ($p) => [
        'query_count' => $p['query_count'] ?? null,
        'duration_ms' => $p['duration_ms'] ?? null,
        'error' => $p['error'] ?? null,
    ])->all(),
], JSON_PRETTY_PRINT).PHP_EOL;
