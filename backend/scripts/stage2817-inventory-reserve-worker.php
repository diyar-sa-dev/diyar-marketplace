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

putenv('APP_ENV=testing');
putenv('DB_CONNECTION=sqlite');
putenv('DB_DATABASE='.$dbPath);
$_ENV['APP_ENV'] = 'testing';
$_ENV['DB_CONNECTION'] = 'sqlite';
$_ENV['DB_DATABASE'] = $dbPath;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use App\Models\Product;
use App\Models\User;
use App\Services\Catalog\InventoryService;
use Illuminate\Contracts\Console\Kernel;

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
