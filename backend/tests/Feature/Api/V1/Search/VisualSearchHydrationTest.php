<?php

namespace Tests\Feature\Api\V1\Search;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\VisualIndexEntry;
use App\Support\VisualSearch\Dhash64Generator;
use App\Support\VisualSearch\VisualHashBits;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class VisualSearchHydrationTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function inactive_product_in_index_does_not_appear_in_results(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Storage::fake('media');
        $png = $this->samplePngBytes();
        $tempPath = sys_get_temp_dir().'/diyar-vs-hydration.png';
        file_put_contents($tempPath, $png);
        $hashBits = (new Dhash64Generator)->fromFilePath($tempPath);
        @unlink($tempPath);

        $active = Product::factory()->create(['name' => 'Active Product']);
        $archived = Product::factory()->create(['name' => 'Archived Product', 'status' => 'archived']);

        foreach ([$active, $archived] as $product) {
            $mediaFile = \App\Models\MediaFile::query()->create([
                'disk' => 'media',
                'path' => 'products/'.$product->id.'/img.png',
                'mime_type' => 'image/png',
                'size_bytes' => strlen($png),
            ]);
            Storage::disk('media')->put($mediaFile->path, $png);
            $productImage = ProductImage::query()->create([
                'product_id' => $product->id,
                'media_file_id' => $mediaFile->id,
                'sort_order' => 1,
            ]);
            VisualIndexEntry::query()->create([
                'id' => (string) Str::uuid(),
                'product_id' => $product->id,
                'product_image_id' => $productImage->id,
                'media_file_id' => $mediaFile->id,
                'hash_bits' => $hashBits,
                'hash_bucket' => VisualHashBits::bucketFromHashBits($hashBits),
                'engine_version' => config('diyar.visual_search.engine_version'),
                'representation_version' => config('diyar.visual_search.representation_version'),
                'index_version' => config('diyar.visual_search.index_version'),
                'is_active' => true,
                'indexed_at' => now(),
            ]);
        }

        $upload = UploadedFile::fake()->createWithContent('query.png', $png, 'image/png');
        $response = $this->post('/api/v1/search/visual', ['image' => $upload], ['Accept' => 'application/json']);

        $response->assertOk();
        $ids = collect($response->json('data.items'))->pluck('id')->all();
        $this->assertContains($active->id, $ids);
        $this->assertNotContains($archived->id, $ids);
        $this->assertSame(1, $response->json('meta.result_count'));
    }

    private function samplePngBytes(): string
    {
        $image = imagecreatetruecolor(128, 128);
        for ($y = 0; $y < 128; $y++) {
            for ($x = 0; $x < 128; $x++) {
                imagesetpixel($image, $x, $y, imagecolorallocate($image, ($x * 3) % 256, ($y * 5) % 256, 100));
            }
        }
        ob_start();
        imagepng($image);
        $png = ob_get_clean();
        imagedestroy($image);

        return (string) $png;
    }
}
