<?php

namespace Tests\Feature\Api\V1\Search;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\VisualIndexEntry;
use App\Support\VisualSearch\Dhash64Generator;
use App\Support\VisualSearch\VisualHashBits;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class VisualSearchTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function visual_search_returns_ranked_public_products_for_matching_image(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Queue::fake();
        Storage::fake('media');

        $png = $this->samplePngBytes();
        $tempPath = sys_get_temp_dir().'/diyar-visual-search-test.png';
        file_put_contents($tempPath, $png);

        $hashBits = (new Dhash64Generator)->fromFilePath($tempPath);
        @unlink($tempPath);

        $product = Product::factory()->create(['name' => 'Indexed Chair']);
        $mediaFile = \App\Models\MediaFile::query()->create([
            'disk' => 'media',
            'path' => 'products/'.$product->id.'/sample.png',
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

        $upload = UploadedFile::fake()->createWithContent('query.png', $png, 'image/png');

        $response = $this->post('/api/v1/search/visual', [
            'image' => $upload,
        ], ['Accept' => 'application/json']);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.items.0.id', $product->id)
            ->assertJsonStructure([
                'data' => [
                    'items' => [['id', 'name', 'similarity']],
                    'pagination' => ['current_page', 'last_page', 'per_page', 'total'],
                ],
                'meta' => ['engine_version', 'representation_version', 'index_version', 'result_count'],
            ]);

        $this->assertNotEmpty($response->json('meta.search_id'));
        $this->assertGreaterThanOrEqual(0.70, (float) $response->json('data.items.0.similarity'));
    }

    #[Test]
    public function visual_search_rejects_oversized_upload(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        $this->seedMinimalIndex();

        $file = UploadedFile::fake()->create('big.png', 3000, 'image/png');

        $this->post('/api/v1/search/visual', ['image' => $file], ['Accept' => 'application/json'])
            ->assertStatus(422);
    }

    #[Test]
    public function visual_search_returns_service_unavailable_when_index_empty(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        $png = $this->samplePngBytes();
        $upload = UploadedFile::fake()->createWithContent('query.png', $png, 'image/png');

        $this->post('/api/v1/search/visual', ['image' => $upload], ['Accept' => 'application/json'])
            ->assertStatus(503);
    }

    private function seedMinimalIndex(): void
    {
        Storage::fake('media');
        $product = Product::factory()->create();
        $png = $this->samplePngBytes();
        $mediaFile = \App\Models\MediaFile::query()->create([
            'disk' => 'media',
            'path' => 'products/'.$product->id.'/seed.png',
            'mime_type' => 'image/png',
            'size_bytes' => strlen($png),
        ]);
        $productImage = ProductImage::query()->create([
            'product_id' => $product->id,
            'media_file_id' => $mediaFile->id,
            'sort_order' => 1,
        ]);
        $hash = random_bytes(8);

        VisualIndexEntry::query()->create([
            'id' => (string) Str::uuid(),
            'product_id' => $product->id,
            'product_image_id' => $productImage->id,
            'media_file_id' => $mediaFile->id,
            'hash_bits' => $hash,
            'hash_bucket' => VisualHashBits::bucketFromHashBits($hash),
            'engine_version' => config('diyar.visual_search.engine_version'),
            'representation_version' => config('diyar.visual_search.representation_version'),
            'index_version' => config('diyar.visual_search.index_version'),
            'is_active' => true,
            'indexed_at' => now(),
        ]);
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
