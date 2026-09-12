<?php

namespace App\Services\Search\Visual;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\VisualIndexEntry;
use App\Support\Cache\CacheKeys;
use App\Support\VisualSearch\Dhash64Generator;
use App\Support\VisualSearch\VisualHashBits;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Throwable;

final class VisualIndexingService
{
    public function __construct(
        private readonly Dhash64Generator $generator,
    ) {}

    public function indexProductImage(ProductImage $productImage): ?VisualIndexEntry
    {
        if (! Schema::hasTable('visual_index_entries')) {
            return null;
        }

        $productImage->loadMissing(['product.vendorAccount', 'mediaFile']);
        $product = $productImage->product;
        $mediaFile = $productImage->mediaFile;

        if ($product === null || $mediaFile === null) {
            return null;
        }

        $isSearchable = Product::query()
            ->publiclyVisible()
            ->whereKey($product->id)
            ->exists();

        if (! $isSearchable) {
            $this->deactivateForProductImage($productImage->id);

            return null;
        }

        $disk = Storage::disk($mediaFile->disk);
        if (! $disk->exists($mediaFile->path)) {
            Log::warning('visual_search.index.missing_media', [
                'product_image_id' => $productImage->id,
                'path' => $mediaFile->path,
            ]);

            return null;
        }

        $tempPath = tempnam(sys_get_temp_dir(), 'diyar-vsi-');
        if ($tempPath === false) {
            return null;
        }

        try {
            file_put_contents($tempPath, $disk->get($mediaFile->path));
            $hashBits = $this->generator->fromFilePath($tempPath);
        } catch (Throwable $exception) {
            Log::warning('visual_search.index.hash_failed', [
                'product_image_id' => $productImage->id,
                'message' => $exception->getMessage(),
            ]);

            return null;
        } finally {
            @unlink($tempPath);
        }

        $entry = VisualIndexEntry::query()->updateOrCreate(
            ['product_image_id' => $productImage->id],
            [
                'product_id' => $productImage->product_id,
                'media_file_id' => $productImage->media_file_id,
                'hash_bits' => $hashBits,
                'hash_bucket' => VisualHashBits::bucketFromHashBits($hashBits),
                'engine_version' => (string) config('diyar.visual_search.engine_version', 'perceptual-v1'),
                'representation_version' => (string) config('diyar.visual_search.representation_version', 'dhash-64-v1'),
                'index_version' => (string) config('diyar.visual_search.index_version', 'catalog-v1'),
                'is_active' => true,
                'indexed_at' => now(),
            ],
        );

        CacheKeys::bumpVisualSearchCacheGeneration();

        return $entry;
    }

    public function deactivateForProductImage(string $productImageId): void
    {
        if (! Schema::hasTable('visual_index_entries')) {
            return;
        }

        $updated = VisualIndexEntry::query()
            ->where('product_image_id', $productImageId)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        if ($updated > 0) {
            CacheKeys::bumpVisualSearchCacheGeneration();
        }
    }

    public function deactivateForProduct(string $productId): void
    {
        if (! Schema::hasTable('visual_index_entries')) {
            return;
        }

        $updated = VisualIndexEntry::query()
            ->where('product_id', $productId)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        if ($updated > 0) {
            CacheKeys::bumpVisualSearchCacheGeneration();
        }
    }
}
