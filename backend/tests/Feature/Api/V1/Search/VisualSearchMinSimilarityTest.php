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

class VisualSearchMinSimilarityTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function results_exclude_candidates_below_min_similarity(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Storage::fake('media');
        $png = $this->makePatternPng(128, 128, 5);
        $tempPath = sys_get_temp_dir().'/vs-min-sim.png';
        file_put_contents($tempPath, $png);
        $queryHash = (new Dhash64Generator)->fromFilePath($tempPath);
        @unlink($tempPath);

        $product = Product::factory()->create();
        $media = \App\Models\MediaFile::query()->create([
            'disk' => 'media',
            'path' => 'products/'.$product->id.'/weak.png',
            'mime_type' => 'image/png',
            'size_bytes' => 100,
        ]);
        $image = ProductImage::query()->create([
            'product_id' => $product->id,
            'media_file_id' => $media->id,
            'sort_order' => 1,
        ]);

        $weakHash = random_bytes(8);
        while (VisualHashBits::similarity($queryHash, $weakHash) >= 0.70) {
            $weakHash = random_bytes(8);
        }

        VisualIndexEntry::query()->create([
            'id' => (string) Str::uuid(),
            'product_id' => $product->id,
            'product_image_id' => $image->id,
            'media_file_id' => $media->id,
            'hash_bits' => $weakHash,
            'hash_bucket' => VisualHashBits::bucketFromHashBits($weakHash),
            'engine_version' => config('diyar.visual_search.engine_version'),
            'representation_version' => config('diyar.visual_search.representation_version'),
            'index_version' => config('diyar.visual_search.index_version'),
            'is_active' => true,
            'indexed_at' => now(),
        ]);

        $upload = UploadedFile::fake()->createWithContent('q.png', $png, 'image/png');
        $response = $this->post('/api/v1/search/visual', ['image' => $upload], ['Accept' => 'application/json']);

        $response->assertOk();
        $this->assertSame(0, $response->json('meta.result_count'));
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
