<?php

namespace Tests\Feature\Api\V1\Search;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\VisualIndexEntry;
use App\Support\VisualSearch\VisualHashBits;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class VisualSearchRateLimitTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('visual-search');
    }

    #[Test]
    public function returns_429_after_twenty_requests_per_minute(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        $this->seedMinimalIndex();
        $png = $this->samplePngBytes();
        $limit = (int) config('diyar.rate_limits.visual_search_per_minute', 20);

        for ($i = 0; $i < $limit; $i++) {
            $upload = UploadedFile::fake()->createWithContent("q{$i}.png", $png, 'image/png');
            $this->post('/api/v1/search/visual', ['image' => $upload], ['Accept' => 'application/json'])
                ->assertOk();
        }

        $upload = UploadedFile::fake()->createWithContent('over-limit.png', $png, 'image/png');
        $this->post('/api/v1/search/visual', ['image' => $upload], ['Accept' => 'application/json'])
            ->assertStatus(429);
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
