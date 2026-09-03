<?php

declare(strict_types=1);

/**
 * Stage 28.2 — Read-only data integrity checks on configured database.
 * Usage: php scripts/stage28-db-integrity-check.php
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$schema = config('database.connections.'.config('database.default').'.database');

$result = [
    'timestamp_utc' => gmdate('c'),
    'schema' => $schema,
    'checks' => [],
];

function check(array &$result, string $name, callable $fn): void
{
    try {
        $data = $fn();
        $result['checks'][$name] = array_merge(['status' => 'PASS'], is_array($data) ? $data : ['value' => $data]);
    } catch (Throwable $e) {
        $result['checks'][$name] = ['status' => 'ERROR', 'error' => $e->getMessage()];
    }
}

check($result, 'orphan_order_items', function () {
    if (! Schema::hasTable('order_items')) {
        return ['skipped' => true];
    }
    $count = DB::selectOne(
        'SELECT COUNT(*) AS c FROM order_items oi
         LEFT JOIN orders o ON o.id = oi.order_id
         WHERE o.id IS NULL'
    );

    return ['orphan_count' => (int) ($count->c ?? 0), 'pass' => ((int) ($count->c ?? 0)) === 0];
});

check($result, 'orphan_cart_items', function () {
    if (! Schema::hasTable('cart_items')) {
        return ['skipped' => true];
    }
    $count = DB::selectOne(
        'SELECT COUNT(*) AS c FROM cart_items ci
         LEFT JOIN carts c ON c.id = ci.cart_id
         WHERE c.id IS NULL'
    );

    return ['orphan_count' => (int) ($count->c ?? 0), 'pass' => ((int) ($count->c ?? 0)) === 0];
});

check($result, 'negative_inventory', function () {
    if (! Schema::hasTable('product_inventory')) {
        return ['skipped' => true];
    }
    $count = DB::selectOne(
        'SELECT COUNT(*) AS c FROM product_inventory WHERE available_quantity < 0 OR stock_quantity < 0 OR reserved_quantity < 0'
    );

    return ['negative_rows' => (int) ($count->c ?? 0), 'pass' => ((int) ($count->c ?? 0)) === 0];
});

check($result, 'negative_order_totals', function () {
    if (! Schema::hasTable('orders')) {
        return ['skipped' => true];
    }
    $count = DB::selectOne(
        'SELECT COUNT(*) AS c FROM orders WHERE grand_total < 0 OR subtotal < 0'
    );

    return ['negative_rows' => (int) ($count->c ?? 0), 'pass' => ((int) ($count->c ?? 0)) === 0];
});

check($result, 'duplicate_order_numbers', function () {
    if (! Schema::hasTable('orders')) {
        return ['skipped' => true];
    }
    $dupes = DB::select(
        'SELECT order_number, COUNT(*) AS c FROM orders GROUP BY order_number HAVING c > 1 LIMIT 10'
    );

    return ['duplicate_groups' => count($dupes), 'pass' => count($dupes) === 0, 'sample' => array_map(fn ($r) => (array) $r, $dupes)];
});

check($result, 'payment_amount_precision', function () {
    if (! Schema::hasTable('payments')) {
        return ['skipped' => true];
    }
    $cols = DB::select(
        'SELECT COLUMN_NAME, DATA_TYPE, NUMERIC_PRECISION, NUMERIC_SCALE
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME IN (?, ?, ?)',
        ['payments', 'amount', 'captured_amount', 'refunded_amount']
    );

    return ['columns' => array_map(fn ($r) => (array) $r, $cols)];
});

check($result, 'failed_jobs_count', function () {
    if (! Schema::hasTable('failed_jobs')) {
        return ['skipped' => true];
    }

    return ['count' => (int) DB::table('failed_jobs')->count()];
});

check($result, 'migrations_pending', function () {
    $files = count(glob(database_path('migrations/*.php')) ?: []);
    $ran = Schema::hasTable('migrations') ? (int) DB::table('migrations')->count() : 0;

    return ['migration_files' => $files, 'migrations_ran' => $ran, 'delta' => $files - $ran];
});

$result['overall'] = collect($result['checks'])
    ->filter(fn ($c) => ! ($c['skipped'] ?? false))
    ->every(fn ($c) => ($c['status'] ?? '') === 'PASS' && ($c['pass'] ?? true) !== false)
    ? 'PASS'
    : 'PARTIAL';

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
