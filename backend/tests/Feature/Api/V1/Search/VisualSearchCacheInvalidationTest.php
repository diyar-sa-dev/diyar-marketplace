<?php

namespace Tests\Feature\Api\V1\Search;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\VisualIndexEntry;
use App\Services\Search\Visual\VisualIndexingService;
use App\Support\Cache\CacheKeys;
use App\Support\VisualSearch\Dhash64Generator;
use App\Support\VisualSearch\VisualHashBits;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class VisualSearchCacheInvalidationTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function index_deactivation_bumps_cache_generation(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Cache::flush();
        Storage::fake('media');

        $before = CacheKeys::visualSearchCacheGeneration();
        $product = Product::factory()->create();
        $png = $this->samplePngBytes();
        $path = 'products/'.$product->id.'/cache-inv.png';
        Storage::disk('media')->put($path, $png);

        $media = \App\Models\MediaFile::query()->create([
            'disk' => 'media',
            'path' => $path,
            'mime_type' => 'image/png',
            'size_bytes' => strlen($png),
        ]);
        $image = ProductImage::query()->create([
            'product_id' => $product->id,
            'media_file_id' => $media->id,
            'sort_order' => 1,
        ]);

        app(VisualIndexingService::class)->indexProductImage($image);
        $afterIndex = CacheKeys::visualSearchCacheGeneration();
        $this->assertGreaterThan($before, $afterIndex);

        app(VisualIndexingService::class)->deactivateForProductImage($image->id);
        $afterDeactivate = CacheKeys::visualSearchCacheGeneration();
        $this->assertGreaterThan($afterIndex, $afterDeactivate);
    }

    #[Test]
    public function cache_key_changes_when_generation_bumps(): void
    {
        Cache::flush();
        $fingerprint = 'abc123';
        $key1 = CacheKeys::visualSearchResult($fingerprint);
        CacheKeys::bumpVisualSearchCacheGeneration();
        $key2 = CacheKeys::visualSearchResult($fingerprint);

        $this->assertNotSame($key1, $key2);
    }

    private function samplePngBytes(): string
    {
        $image = imagecreatetruecolor(64, 64);
        ob_start();
        imagepng($image);
        $png = ob_get_clean();
        imagedestroy($image);

        return (string) $png;
    }
}
