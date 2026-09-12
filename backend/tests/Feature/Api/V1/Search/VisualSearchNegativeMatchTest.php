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

class VisualSearchNegativeMatchTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function unrelated_pattern_image_returns_empty_or_below_threshold(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Storage::fake('media');
        $this->seedIndexedGradientProduct(seed: 1);

        $unrelated = $this->makePatternPng(400, 400, 99);
        $upload = UploadedFile::fake()->createWithContent('unrelated.png', $unrelated, 'image/png');

        $response = $this->post('/api/v1/search/visual', ['image' => $upload], ['Accept' => 'application/json']);
        $response->assertOk();

        $items = $response->json('data.items') ?? [];
        if ($items !== []) {
            $this->assertLessThan(0.70, (float) ($items[0]['similarity'] ?? 0));
        } else {
            $this->assertSame(0, $response->json('meta.result_count'));
        }
    }

    private function seedIndexedGradientProduct(int $seed): Product
    {
        $product = Product::factory()->create();
        $png = $this->makePatternPng(400, 400, $seed);
        $mediaFile = \App\Models\MediaFile::query()->create([
            'disk' => 'media',
            'path' => 'products/'.$product->id.'/gradient.png',
            'mime_type' => 'image/png',
            'size_bytes' => strlen($png),
        ]);
        Storage::disk('media')->put($mediaFile->path, $png);
        $productImage = ProductImage::query()->create([
            'product_id' => $product->id,
            'media_file_id' => $mediaFile->id,
            'sort_order' => 1,
        ]);
        $tempPath = sys_get_temp_dir().'/vs-neg-'.$seed.'.png';
        file_put_contents($tempPath, $png);
        $hashBits = (new Dhash64Generator)->fromFilePath($tempPath);
        @unlink($tempPath);

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

        return $product;
    }

    private function makePatternPng(int $w, int $h, int $seed): string
    {
        $img = imagecreatetruecolor($w, $h);
        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                imagesetpixel($img, $x, $y, imagecolorallocate($img, ($x * 7 + $seed * 41) % 256, ($y * 11 + $seed * 23) % 256, (($x + $y) * 5 + $seed * 17) % 256));
            }
        }
        ob_start();
        imagepng($img);
        $png = ob_get_clean();
        imagedestroy($img);

        return (string) $png;
    }
}
