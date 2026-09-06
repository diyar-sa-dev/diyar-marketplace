<?php

declare(strict_types=1);

/**
 * Worker: attempt one inventory reservation against a shared sqlite DB.
 *
 * Args: db_path product_id user_id
 * Exit 0 = reserved, 1 = rejected
 */
$dbPath = $argv[1] ?? '';
$productId = $argv[2] ?? '';
$userId = $argv[3] ?? '';

if ($dbPath === '' || $productId === '' || $userId === '') {
    fwrite(STDERR, "usage: inventory-reserve-worker.php db_path product_id user_id\n");
    exit(2);
}

require __DIR__.'/concurrency-worker-bootstrap.php';
bootstrapConcurrencyWorker($dbPath);

use App\Models\Product;
use App\Models\User;
use App\Services\Catalog\InventoryService;

try {
    $product = Product::query()->findOrFail($productId);
    $user = User::query()->findOrFail($userId);

    app(InventoryService::class)->reserve($product, $user, 1);

    echo "reserved\n";
    exit(0);
} catch (Throwable $e) {
    echo 'rejected: '.$e->getMessage()."\n";
    exit(1);
}
