<?php

declare(strict_types=1);

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

$disk = (string) config('diyar_media.disk', 'media');
$orphanProductIds = [];
foreach (Storage::disk($disk)->allDirectories('products') as $dir) {
    $pid = basename($dir);
    if (! DB::table('products')->where('id', $pid)->exists() && Storage::disk($disk)->files($dir) !== []) {
        $orphanProductIds[] = $pid;
    }
}

$refs = [];
foreach ($orphanProductIds as $pid) {
    foreach (['order_items', 'cart_items', 'product_translations', 'product_variants', 'reviews', 'wishlist_items'] as $table) {
        if (! Schema::hasTable($table)) {
            continue;
        }
        if (! Schema::hasColumn($table, 'product_id')) {
            continue;
        }
        $count = DB::table($table)->where('product_id', $pid)->count();
        if ($count > 0) {
            $refs[] = ['product_id' => $pid, 'table' => $table, 'count' => $count];
        }
    }
}

echo json_encode([
    'orphan_product_ids' => $orphanProductIds,
    'cross_refs' => $refs,
    'current_products' => DB::table('products')->pluck('id'),
], JSON_PRETTY_PRINT).PHP_EOL;
