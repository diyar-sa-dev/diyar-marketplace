<?php

declare(strict_types=1);

/**
 * Restore deleted merchant products from filesystem paths (deterministic product UUID in path).
 */

use App\Enums\AvailabilityMode;
use App\Enums\ProductStatus;
use App\Enums\ProductType;
use App\Jobs\Search\IndexProductImageJob;
use App\Jobs\Search\RemoveVisualIndexEntryJob;
use App\Models\Category;
use App\Models\MediaFile;
use App\Models\Product;
use App\Models\ProductColor;
use App\Models\ProductImage;
use App\Models\ProductInventory;
use App\Models\User;
use App\Models\VendorAccount;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$runId = $argv[1] ?? gmdate('Y-m-d_His');
$disk = (string) config('diyar_media.disk', 'media');
$uploader = User::query()->where('email', 'vendor@diyar.local')->first()
    ?? User::query()->first();
$vendor = VendorAccount::query()->where('slug', 'diyar-furniture')->first()
    ?? VendorAccount::query()->where('status', 'active')->first();
$category = Category::query()->where('slug', 'bedroom')->first()
    ?? Category::query()->first();

if ($vendor === null || $category === null) {
    fwrite(STDERR, "Missing vendor or category.\n");
    exit(1);
}

$catalogManifestPath = __DIR__.'/restored-product-catalog.json';
$catalogManifest = is_file($catalogManifestPath)
    ? json_decode((string) file_get_contents($catalogManifestPath), true, 512, JSON_THROW_ON_ERROR)
    : [];

DB::transaction(function () use ($disk, $uploader, $vendor, $category, $runId, $catalogManifest): void {
    foreach (ProductImage::query()->with('mediaFile')->get() as $pi) {
        RemoveVisualIndexEntryJob::dispatchSync($pi->id);
        $pi->delete();
    }

    $restored = [];
    foreach (Storage::disk($disk)->allDirectories('products') as $dir) {
        $productId = basename($dir);
        $files = Storage::disk($disk)->files($dir);
        if ($files === []) {
            continue;
        }

        $product = Product::query()->find($productId);
        if ($product === null) {
            $manifest = is_array($catalogManifest[$productId] ?? null) ? $catalogManifest[$productId] : null;
            $manifestCategory = $manifest !== null
                ? (Category::query()->where('slug', $manifest['category'] ?? 'bedroom')->first() ?? $category)
                : $category;
            $productName = (string) ($manifest['name'] ?? ('Restored product '.substr($productId, 0, 8)));

            $product = new Product;
            $product->id = $productId;
            $product->fill([
                'vendor_account_id' => $vendor->id,
                'category_id' => $manifestCategory->id,
                'name' => $productName,
                'slug' => \Illuminate\Support\Str::slug($productName),
                'description' => (string) ($manifest['description'] ?? 'Restored from filesystem media path.'),
                'sale_price' => (float) ($manifest['sale_price'] ?? 999),
                'compare_price' => $manifest['compare_price'] ?? null,
                'product_type' => ProductType::Single,
                'availability_mode' => AvailabilityMode::InStock,
                'status' => ProductStatus::Active,
            ]);
            $product->save();

            ProductColor::query()->create([
                'product_id' => $product->id,
                'name' => 'Default',
                'hex_code' => '#CCCCCC',
            ]);
            ProductInventory::query()->create([
                'product_id' => $product->id,
                'stock_quantity' => 5,
                'reserved_quantity' => 0,
                'available_quantity' => 5,
            ]);
        }

        $sort = 1;
        foreach ($files as $path) {
            if (! str_starts_with($path, "products/{$productId}/")) {
                continue;
            }
            $media = MediaFile::query()->firstOrCreate(
                ['path' => $path],
                [
                    'disk' => $disk,
                    'mime_type' => match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
                        'webp' => 'image/webp',
                        'jpg', 'jpeg' => 'image/jpeg',
                        default => 'image/png',
                    },
                    'size_bytes' => Storage::disk($disk)->size($path),
                    'uploaded_by' => $uploader?->id,
                ],
            );

            $pi = ProductImage::query()->firstOrCreate(
                ['product_id' => $product->id, 'media_file_id' => $media->id],
                ['sort_order' => $sort++],
            );
            IndexProductImageJob::dispatchSync($pi->id);
            $restored[] = ['product_id' => $product->id, 'path' => $path, 'product_image_id' => $pi->id];
        }
    }

    file_put_contents(
        storage_path("certification/visual-search/enterprise/{$runId}/02-media-recovery/orphan-product-restore.json"),
        json_encode(['restored' => $restored, 'count' => count($restored)], JSON_PRETTY_PRINT),
    );
});

echo json_encode([
    'product_images' => ProductImage::query()->count(),
    'merchant_paths' => ProductImage::query()->whereHas('mediaFile', fn ($q) => $q->where('path', 'like', 'products/%'))->count(),
    'active_index' => \App\Models\VisualIndexEntry::query()->where('is_active', true)->count(),
], JSON_PRETTY_PRINT).PHP_EOL;
