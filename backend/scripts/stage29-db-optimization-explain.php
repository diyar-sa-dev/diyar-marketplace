<?php

declare(strict_types=1);

/**
 * Stage 28.9 — EXPLAIN capture for database optimization before/after comparison.
 * Usage: php scripts/stage29-db-optimization-explain.php [--label=before|after]
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$label = 'snapshot';
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--label=')) {
        $label = substr($arg, 8);
    }
}

if (config('database.default') === 'sqlite') {
    echo json_encode([
        'label' => $label,
        'skipped' => true,
        'reason' => 'EXPLAIN ANALYZE requires MySQL/MariaDB',
    ], JSON_PRETTY_PRINT).PHP_EOL;
    exit(0);
}

$active = 'active';
$queries = [
    'products_public_list' => [
        'sql' => 'SELECT id, name, sale_price FROM products WHERE status = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 20',
        'bindings' => [$active],
    ],
    'products_category_list' => [
        'sql' => 'SELECT id FROM products WHERE category_id = ? AND status = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 20',
        'bindings' => ['00000000-0000-0000-0000-000000000001', $active],
    ],
    'products_vendor_list' => [
        'sql' => 'SELECT id FROM products WHERE vendor_account_id = ? AND status = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 20',
        'bindings' => ['00000000-0000-0000-0000-000000000001', $active],
    ],
    'analytics_events_30d' => [
        'sql' => 'SELECT event_type, COUNT(*) AS c FROM analytics_events WHERE created_at >= ? GROUP BY event_type',
        'bindings' => [now()->subDays(30)->toDateTimeString()],
    ],
    'orders_admin_list' => [
        'sql' => 'SELECT id FROM orders ORDER BY created_at DESC LIMIT 20',
        'bindings' => [],
    ],
    'orders_admin_status' => [
        'sql' => 'SELECT id FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT 20',
        'bindings' => ['pending'],
    ],
    'orders_user_list' => [
        'sql' => 'SELECT id FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
        'bindings' => ['00000000-0000-0000-0000-000000000001'],
    ],
];

$result = [
    'label' => $label,
    'timestamp_utc' => gmdate('c'),
    'engine' => DB::selectOne('SELECT VERSION() AS v')?->v,
    'products_count' => (int) (DB::table('products')->count()),
    'queries' => [],
];

foreach ($queries as $name => $spec) {
    $entry = ['name' => $name, 'sql' => $spec['sql']];
    try {
        $entry['explain'] = DB::select('EXPLAIN '.$spec['sql'], $spec['bindings']);
    } catch (Throwable $e) {
        $entry['explain_error'] = $e->getMessage();
    }
    try {
        $rows = DB::select('EXPLAIN ANALYZE '.$spec['sql'], $spec['bindings']);
        $entry['explain_analyze'] = array_map(fn ($r) => (array) $r, $rows);
    } catch (Throwable $e) {
        $entry['explain_analyze_error'] = $e->getMessage();
    }
    $result['queries'][] = $entry;
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
