<?php

declare(strict_types=1);

/**
 * Phase 28.9 closure — MySQL 8 scale verification (non-destructive seed + benchmarks).
 * Usage: php scripts/stage29-db-closure-verify.php [--output-dir=path]
 *
 * Env (defaults = staging MySQL 8 on 3307):
 *   DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

$defaults = [
    'APP_ENV' => 'local',
    'DB_CONNECTION' => 'mysql',
    'DB_HOST' => '127.0.0.1',
    'DB_PORT' => '3307',
    'DB_DATABASE' => 'diyar_staging',
    'DB_USERNAME' => 'root',
    'DB_PASSWORD' => 'staging_root',
    'DB_URL' => '',
];
foreach ($defaults as $k => $v) {
    putenv("$k=$v");
    $_ENV[$k] = $v;
    $_SERVER[$k] = $v;
}

require __DIR__.'/../vendor/autoload.php';

$outputDir = dirname(__DIR__, 2).'/conception/Stages/Stage 28/Phase 28.9 - Database Optimization';
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--output-dir=')) {
        $outputDir = substr($arg, 13);
    }
}

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (config('database.default') === 'sqlite') {
    fwrite(STDERR, "Requires MySQL.\n");
    exit(1);
}

function timedQuery(string $sql, array $bindings = []): array
{
    $start = microtime(true);
    $rows = DB::select($sql, $bindings);
    $ms = round((microtime(true) - $start) * 1000, 3);

    return ['row_count' => count($rows), 'duration_ms' => $ms];
}

function explainRow(string $sql, array $bindings = []): array
{
    $rows = DB::select('EXPLAIN '.$sql, $bindings);
    $first = (array) ($rows[0] ?? []);

    return [
        'type' => $first['type'] ?? $first['select_type'] ?? null,
        'key' => $first['key'] ?? null,
        'rows' => $first['rows'] ?? null,
        'extra' => $first['Extra'] ?? $first['extra'] ?? null,
    ];
}

function explainAnalyzeMs(string $sql, array $bindings = []): ?float
{
    try {
        $rows = DB::select('EXPLAIN ANALYZE '.$sql, $bindings);
        $text = (string) (($rows[0] ?? null)?->EXPLAIN ?? '');
        if (preg_match('/actual time=([\d.]+)\.\.([\d.]+)/', $text, $m)) {
            return (float) $m[2];
        }
    } catch (Throwable) {
        return null;
    }

    return null;
}

$result = [
    'timestamp_utc' => gmdate('c'),
    'engine' => DB::selectOne('SELECT VERSION() AS v')?->v,
    'database' => config('database.connections.mysql.database'),
    'targets' => [
        'products' => 10000,
        'orders' => 10000,
        'analytics_events' => 100000,
    ],
    'seed' => [],
    'row_counts' => [],
    'optimizations' => [],
    'pagination' => [],
    'analytics' => [],
    'admin_orders' => [],
];

// Non-destructive scale seed
try {
    putenv('DIYAR_PERF_DATASET_SCALE=100');
    $_ENV['DIYAR_PERF_DATASET_SCALE'] = '100';
    $seedStart = microtime(true);
    Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\PerformanceDatasetSeeder', '--force' => true]);
    $result['seed'] = [
        'ok' => true,
        'scale' => 100,
        'duration_ms' => round((microtime(true) - $seedStart) * 1000, 2),
    ];
} catch (Throwable $e) {
    $result['seed'] = ['ok' => false, 'error' => $e->getMessage()];
}

$result['row_counts'] = [
    'products' => (int) DB::table('products')->count(),
    'orders' => (int) DB::table('orders')->count(),
    'analytics_events' => (int) DB::table('analytics_events')->count(),
];

$active = 'active';
$perPage = 20;
$sampleCategory = DB::table('products')->whereNotNull('category_id')->value('category_id');
$sampleVendor = DB::table('products')->whereNotNull('vendor_account_id')->value('vendor_account_id');
$sampleUser = DB::table('orders')->whereNotNull('user_id')->value('user_id');

$optQueries = [
    'OPT-DB-001' => [
        'sql' => 'SELECT id FROM products WHERE status = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 20',
        'bindings' => [$active],
        'expected_key' => 'products_status_created_at_index',
    ],
    'OPT-DB-004' => [
        'sql' => 'SELECT id FROM products WHERE category_id = ? AND status = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 20',
        'bindings' => [$sampleCategory, $active],
        'expected_keys' => ['products_category_status_created_at_index', 'products_category_id_status_index', 'products_status_created_at_index'],
    ],
    'OPT-DB-005' => [
        'sql' => 'SELECT id FROM products WHERE vendor_account_id = ? AND status = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 20',
        'bindings' => [$sampleVendor, $active],
        'expected_keys' => ['products_vendor_status_created_at_index', 'products_vendor_account_id_status_index', 'products_status_created_at_index'],
    ],
    'OPT-DB-006' => [
        'sql' => 'SELECT id FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
        'bindings' => [$sampleUser],
        'expected_key' => 'orders_user_created_at_index',
    ],
    'OPT-DB-007' => [
        'sql' => 'SELECT id FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT 20',
        'bindings' => ['completed'],
        'expected_key' => 'orders_status_created_at_index',
    ],
    'OPT-DB-007b' => [
        'sql' => 'SELECT id FROM orders ORDER BY created_at DESC LIMIT 20',
        'bindings' => [],
        'expected_key' => 'orders_created_at_index',
    ],
];

foreach ($optQueries as $id => $spec) {
    $plan = explainRow($spec['sql'], $spec['bindings']);
    $result['optimizations'][$id] = [
        'explain' => $plan,
        'analyze_ms' => explainAnalyzeMs($spec['sql'], $spec['bindings']),
        'timing' => timedQuery($spec['sql'], $spec['bindings']),
        'pass' => isset($spec['expected_key'])
            ? ($plan['key'] === $spec['expected_key'] && ! str_contains(strtolower((string) $plan['extra']), 'filesort'))
            : in_array($plan['key'], $spec['expected_keys'] ?? [], true),
    ];
}

// Pagination matrix — pages 1, 5, 10, 25, 50, 100 @ 20/page
$pages = [1, 5, 10, 25, 50, 100];
foreach ($pages as $page) {
    $offset = ($page - 1) * $perPage;
    $sql = 'SELECT id FROM products WHERE status = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?';
    $bindings = [$active, $perPage, $offset];
    $plan = explainRow($sql, $bindings);
    $timing = timedQuery($sql, $bindings);
    $result['pagination'][] = [
        'page' => $page,
        'offset' => $offset,
        'products_in_db' => $result['row_counts']['products'],
        'explain' => $plan,
        'duration_ms' => $timing['duration_ms'],
        'analyze_ms' => explainAnalyzeMs($sql, $bindings),
        'acceptable' => $page <= 25 || $timing['duration_ms'] < 50,
    ];
}

// Analytics OPT-DB-002 @ current scale
$since = now()->subDays(30)->toDateTimeString();
$analyticsSql = 'SELECT event_type, COUNT(*) AS c FROM analytics_events WHERE created_at >= ? GROUP BY event_type';
$result['analytics']['OPT-DB-002'] = [
    'row_count' => $result['row_counts']['analytics_events'],
    'explain' => explainRow($analyticsSql, [$since]),
    'duration_ms' => timedQuery($analyticsSql, [$since])['duration_ms'],
    'analyze_ms' => explainAnalyzeMs($analyticsSql, [$since]),
];

// Admin orders OPT-DB-003
$adminSql = 'SELECT id FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 0';
$adminStatusSql = 'SELECT id FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT 20';
$result['admin_orders']['OPT-DB-003'] = [
    'orders_in_db' => $result['row_counts']['orders'],
    'list_explain' => explainRow($adminSql, []),
    'list_ms' => timedQuery($adminSql, [])['duration_ms'],
    'status_explain' => explainRow($adminStatusSql, ['completed']),
    'status_ms' => timedQuery($adminStatusSql, ['completed'])['duration_ms'],
    'deep_offset_500' => array_merge(
        explainRow('SELECT id FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 500', []),
        timedQuery('SELECT id FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 500', [])
    ),
];

File::ensureDirectoryExists($outputDir);
$outFile = $outputDir.'/_db_closure_verify_mysql8.json';
File::put($outFile, json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo json_encode(['written' => $outFile, 'summary' => [
    'products' => $result['row_counts']['products'],
    'orders' => $result['row_counts']['orders'],
    'analytics' => $result['row_counts']['analytics_events'],
    'opt_pass' => count(array_filter($result['optimizations'], fn ($o) => $o['pass'])),
    'opt_total' => count($result['optimizations']),
]], JSON_PRETTY_PRINT).PHP_EOL;
