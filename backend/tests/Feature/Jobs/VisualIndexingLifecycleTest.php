<?php

namespace Tests\Feature\Jobs;

use App\Jobs\Search\IndexProductImageJob;
use App\Jobs\Search\RemoveVisualIndexEntryJob;
use App\Models\MediaFile;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\VisualIndexEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class VisualIndexingLifecycleTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function attach_image_indexes_active_row(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Storage::fake('media');
        $product = Product::factory()->create();
        $png = $this->samplePngBytes();
        $path = 'products/'.$product->id.'/lifecycle.png';
        Storage::disk('media')->put($path, $png);

        $media = MediaFile::query()->create([
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

        IndexProductImageJob::dispatchSync($image->id);

        $this->assertDatabaseHas('visual_index_entries', [
            'product_image_id' => $image->id,
            'is_active' => true,
        ]);
    }

    #[Test]
    public function triple_dispatch_creates_single_row(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Storage::fake('media');
        $product = Product::factory()->create();
        $png = $this->samplePngBytes();
        $path = 'products/'.$product->id.'/triple.png';
        Storage::disk('media')->put($path, $png);

        $media = MediaFile::query()->create([
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

        IndexProductImageJob::dispatchSync($image->id);
        IndexProductImageJob::dispatchSync($image->id);
        IndexProductImageJob::dispatchSync($image->id);

        $this->assertSame(1, VisualIndexEntry::query()->where('product_image_id', $image->id)->count());
    }

    #[Test]
    public function remove_job_deactivates_index_row(): void
    {
        Storage::fake('media');
        $product = Product::factory()->create();
        $media = MediaFile::query()->create([
            'disk' => 'media',
            'path' => 'products/'.$product->id.'/remove.png',
            'mime_type' => 'image/png',
            'size_bytes' => 100,
        ]);
        $image = ProductImage::query()->create([
            'product_id' => $product->id,
            'media_file_id' => $media->id,
            'sort_order' => 1,
        ]);

        VisualIndexEntry::query()->create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'product_id' => $product->id,
            'product_image_id' => $image->id,
            'media_file_id' => $media->id,
            'hash_bits' => random_bytes(8),
            'hash_bucket' => 1,
            'engine_version' => config('diyar.visual_search.engine_version'),
            'representation_version' => config('diyar.visual_search.representation_version'),
            'index_version' => config('diyar.visual_search.index_version'),
            'is_active' => true,
            'indexed_at' => now(),
        ]);

        RemoveVisualIndexEntryJob::dispatchSync($image->id);

        $this->assertFalse(
            VisualIndexEntry::query()->where('product_image_id', $image->id)->where('is_active', true)->exists(),
        );
    }

    #[Test]
    public function archive_product_deactivates_all_index_rows(): void
    {
        Storage::fake('media');
        $product = Product::factory()->create();
        $png = $this->samplePngBytes();
        $path = 'products/'.$product->id.'/archive.png';
        Storage::disk('media')->put($path, $png);

        $media = MediaFile::query()->create([
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

        IndexProductImageJob::dispatchSync($image->id);
        $this->assertTrue(VisualIndexEntry::query()->where('product_image_id', $image->id)->where('is_active', true)->exists());

        $product->update(['status' => 'archived']);
        IndexProductImageJob::dispatchSync($image->id);

        $this->assertFalse(
            VisualIndexEntry::query()->where('product_image_id', $image->id)->where('is_active', true)->exists(),
        );
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
