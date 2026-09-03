<?php

declare(strict_types=1);

/**
 * EXPLAIN representative catalog/search queries.
 *
 * Usage: php scripts/stage2817-db-explain.php
 */

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

if (DB::getDriverName() !== 'mysql') {
    echo "SKIP: EXPLAIN requires MySQL (current: ".DB::getDriverName().")\n";
    exit(0);
}

$queries = [
    'products_public_list' => 'SELECT id FROM products WHERE status = ? ORDER BY created_at DESC LIMIT 24',
    'products_search_fulltext' => 'SELECT id FROM products WHERE MATCH(name, description) AGAINST (? IN NATURAL LANGUAGE MODE) AND status = ? LIMIT 24',
    'categories_active' => 'SELECT id, slug FROM categories WHERE is_active = 1 ORDER BY sort_order',
    'orders_by_user' => 'SELECT id FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 15',
    'inventory_by_product' => 'SELECT * FROM product_inventory WHERE product_id = ? FOR UPDATE',
];

echo "=== DB EXPLAIN (MySQL) ===\n";

foreach ($queries as $name => $sql) {
    echo "\n--- {$name} ---\n";
    $params = match ($name) {
        'products_public_list' => ['published'],
        'products_search_fulltext' => ['bed', 'published'],
        'categories_active' => [],
        'orders_by_user' => ['00000000-0000-0000-0000-000000000000'],
        'inventory_by_product' => ['00000000-0000-0000-0000-000000000000'],
    };

    $plan = DB::select('EXPLAIN '.$sql, $params);
    foreach ($plan as $row) {
        $type = $row->type ?? $row->select_type ?? '?';
        $key = $row->key ?? 'NULL';
        $rows = $row->rows ?? '?';
        echo "  type={$type} key={$key} rows={$rows}\n";
    }
}
