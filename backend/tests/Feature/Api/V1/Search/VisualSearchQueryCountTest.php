<?php

namespace Tests\Feature\Api\V1\Search;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\VisualIndexEntry;
use App\Services\Search\Visual\VisualCandidateRetriever;
use App\Support\VisualSearch\Dhash64Generator;
use App\Support\VisualSearch\VisualHashBits;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class VisualSearchQueryCountTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function candidate_retriever_uses_single_sql_query_for_prefetch(): void
    {
        Storage::fake('media');
        $png = $this->samplePngBytes();
        $tempPath = sys_get_temp_dir().'/diyar-query-count.png';
        file_put_contents($tempPath, $png);
        $hashBits = (new Dhash64Generator)->fromFilePath($tempPath);
        @unlink($tempPath);

        $product = Product::factory()->create();
        $mediaFile = \App\Models\MediaFile::query()->create([
            'disk' => 'media',
            'path' => 'products/'.$product->id.'/sample.png',
            'mime_type' => 'image/png',
            'size_bytes' => strlen($png),
        ]);
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

        DB::enableQueryLog();
        DB::flushQueryLog();

        app(VisualCandidateRetriever::class)->retrieve($hashBits, 19);

        $this->assertLessThanOrEqual(2, count(DB::getQueryLog()));
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
