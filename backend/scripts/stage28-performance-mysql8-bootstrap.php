<?php

declare(strict_types=1);

/**
 * Stage 28.7 — Bootstrap MySQL 8 performance dataset (isolated DB only).
 * Usage: php scripts/stage28-performance-mysql8-bootstrap.php [--scale=10]
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;

require __DIR__.'/../vendor/autoload.php';

$scale = 10;
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--scale=')) {
        $scale = max(1, min(100, (int) substr($arg, 8)));
    }
}

$defaults = [
    'APP_ENV' => 'local',
    'DB_CONNECTION' => 'mysql',
    'DB_HOST' => '127.0.0.1',
    'DB_PORT' => '3307',
    'DB_DATABASE' => 'diyar_staging',
    'DB_USERNAME' => 'root',
    'DB_PASSWORD' => 'staging_root',
    'CACHE_STORE' => 'redis',
    'REDIS_HOST' => '127.0.0.1',
    'REDIS_PREFIX' => 'diyar-staging-perf-',
    'DIYAR_LOADTEST_MODE' => 'true',
    'DIYAR_PERF_DATASET_SCALE' => (string) $scale,
];

foreach ($defaults as $key => $value) {
    if (getenv($key) === false) {
        putenv($key.'='.$value);
        $_ENV[$key] = $value;
    }
}
putenv('DIYAR_PERF_DATASET_SCALE='.(string) $scale);
$_ENV['DIYAR_PERF_DATASET_SCALE'] = (string) $scale;

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$result = ['timestamp_utc' => gmdate('c'), 'scale' => $scale, 'steps' => []];

try {
    $started = microtime(true);
    Artisan::call('migrate:fresh', ['--seed' => true, '--seeder' => 'DatabaseSeeder', '--force' => true]);
    $result['steps']['migrate_fresh_seed'] = [
        'ok' => true,
        'duration_ms' => round((microtime(true) - $started) * 1000, 2),
        'output_tail' => implode("\n", array_slice(explode("\n", trim(Artisan::output())), -5)),
    ];
} catch (Throwable $e) {
    $result['steps']['migrate_fresh_seed'] = ['ok' => false, 'error' => $e->getMessage()];
    echo json_encode($result, JSON_PRETTY_PRINT).PHP_EOL;
    exit(1);
}

try {
    $started = microtime(true);
    Artisan::call('db:seed', ['--class' => 'PerformanceDatasetSeeder', '--force' => true]);
    $result['steps']['performance_dataset'] = [
        'ok' => true,
        'duration_ms' => round((microtime(true) - $started) * 1000, 2),
        'output' => trim(Artisan::output()),
    ];
} catch (Throwable $e) {
    $result['steps']['performance_dataset'] = ['ok' => false, 'error' => $e->getMessage()];
}

$result['database'] = config('database.connections.mysql.database');
$result['engine'] = \Illuminate\Support\Facades\DB::selectOne('SELECT VERSION() AS v')?->v;

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
