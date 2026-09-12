<?php

namespace Tests\Feature\Api\V1\Search;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\VisualIndexEntry;
use App\Support\VisualSearch\VisualHashBits;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class VisualSearchSecurityTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function rejects_corrupt_binary_as_image(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        $this->seedMinimalIndex();

        $file = UploadedFile::fake()->createWithContent('bad.jpg', random_bytes(256), 'image/jpeg');

        $this->post('/api/v1/search/visual', ['image' => $file], ['Accept' => 'application/json'])
            ->assertStatus(422);
    }

    #[Test]
    public function rejects_svg_upload(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        $this->seedMinimalIndex();

        $file = UploadedFile::fake()->createWithContent(
            'icon.svg',
            '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>',
            'image/svg+xml',
        );

        $this->post('/api/v1/search/visual', ['image' => $file], ['Accept' => 'application/json'])
            ->assertStatus(422);
    }

    #[Test]
    public function rejects_dimension_over_2048(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        $this->seedMinimalIndex();

        $img = imagecreatetruecolor(2049, 100);
        ob_start();
        imagepng($img);
        $png = ob_get_clean();
        imagedestroy($img);

        $file = UploadedFile::fake()->createWithContent('wide.png', $png, 'image/png');

        $this->post('/api/v1/search/visual', ['image' => $file], ['Accept' => 'application/json'])
            ->assertStatus(422);
    }

    #[Test]
    public function rejects_pixel_count_over_four_million(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        $this->seedMinimalIndex();

        $img = imagecreatetruecolor(3000, 2000);
        ob_start();
        imagepng($img);
        $png = ob_get_clean();
        imagedestroy($img);

        $file = UploadedFile::fake()->createWithContent('huge.png', $png, 'image/png');

        $this->post('/api/v1/search/visual', ['image' => $file], ['Accept' => 'application/json'])
            ->assertStatus(422);
    }

    #[Test]
    public function accepts_2048_by_2048_within_limits(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        $this->seedMinimalIndex();

        $img = imagecreatetruecolor(2048, 1950);
        ob_start();
        imagepng($img);
        $png = ob_get_clean();
        imagedestroy($img);

        $file = UploadedFile::fake()->createWithContent('max.png', $png, 'image/png');

        $this->post('/api/v1/search/visual', ['image' => $file], ['Accept' => 'application/json'])
            ->assertOk();
    }

    #[Test]
    public function rejects_html_mime_spoof_as_jpeg(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        $this->seedMinimalIndex();

        $file = UploadedFile::fake()->createWithContent(
            'fake.jpg',
            '<html><body>not an image</body></html>',
            'image/jpeg',
        );

        $this->post('/api/v1/search/visual', ['image' => $file], ['Accept' => 'application/json'])
            ->assertStatus(422);
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
