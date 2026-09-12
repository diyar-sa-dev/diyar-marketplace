<?php

namespace Tests\Unit\Services\Search\Visual;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\VisualIndexEntry;
use App\Services\Search\Visual\VisualCandidateRetriever;
use App\Support\VisualSearch\BucketProbe;
use App\Support\VisualSearch\VisualHashBits;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class VisualCandidateRetrieverTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function radius_three_probe_set_exceeds_nine_buckets(): void
    {
        $buckets = BucketProbe::probeBuckets(578, 3);

        $this->assertGreaterThan(9, count($buckets));
        $this->assertContains(64, $buckets);
    }

    #[Test]
    public function retrieve_respects_prefetch_cap(): void
    {
        $queryHash = random_bytes(8);
        $bucket = VisualHashBits::bucketFromHashBits($queryHash);
        $product = Product::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $media = \App\Models\MediaFile::query()->create([
                'disk' => 'media',
                'path' => "products/{$product->id}/{$i}.png",
                'mime_type' => 'image/png',
                'size_bytes' => 100,
            ]);
            $image = ProductImage::query()->create([
                'product_id' => $product->id,
                'media_file_id' => $media->id,
                'sort_order' => $i,
            ]);
            VisualIndexEntry::query()->create([
                'id' => (string) Str::uuid(),
                'product_id' => $product->id,
                'product_image_id' => $image->id,
                'media_file_id' => $media->id,
                'hash_bits' => $queryHash,
                'hash_bucket' => $bucket,
                'engine_version' => config('diyar.visual_search.engine_version'),
                'representation_version' => config('diyar.visual_search.representation_version'),
                'index_version' => config('diyar.visual_search.index_version'),
                'is_active' => true,
                'indexed_at' => now(),
            ]);
        }

        $retriever = app(VisualCandidateRetriever::class);
        $candidates = $retriever->retrieve($queryHash, 19);

        $this->assertCount(5, $candidates);
        $this->assertSame(0, $candidates[0]->hammingDistance);
    }

    #[Test]
    public function retrieve_filters_by_hamming_threshold(): void
    {
        $queryHash = random_bytes(8);
        $bucket = VisualHashBits::bucketFromHashBits($queryHash);
        $product = Product::factory()->create();
        $media = \App\Models\MediaFile::query()->create([
            'disk' => 'media',
            'path' => "products/{$product->id}/far.png",
            'mime_type' => 'image/png',
            'size_bytes' => 100,
        ]);
        $image = ProductImage::query()->create([
            'product_id' => $product->id,
            'media_file_id' => $media->id,
            'sort_order' => 1,
        ]);

        $farHash = random_bytes(8);
        while (VisualHashBits::hammingDistance($queryHash, $farHash) <= 19) {
            $farHash = random_bytes(8);
        }

        VisualIndexEntry::query()->create([
            'id' => (string) Str::uuid(),
            'product_id' => $product->id,
            'product_image_id' => $image->id,
            'media_file_id' => $media->id,
            'hash_bits' => $farHash,
            'hash_bucket' => VisualHashBits::bucketFromHashBits($farHash),
            'engine_version' => config('diyar.visual_search.engine_version'),
            'representation_version' => config('diyar.visual_search.representation_version'),
            'index_version' => config('diyar.visual_search.index_version'),
            'is_active' => true,
            'indexed_at' => now(),
        ]);

        $candidates = app(VisualCandidateRetriever::class)->retrieve($queryHash, 19);

        $this->assertSame([], $candidates);
    }

    #[Test]
    public function retrieve_ignores_inactive_rows(): void
    {
        $queryHash = random_bytes(8);
        $product = Product::factory()->create();
        $media = \App\Models\MediaFile::query()->create([
            'disk' => 'media',
            'path' => "products/{$product->id}/inactive.png",
            'mime_type' => 'image/png',
            'size_bytes' => 100,
        ]);
        $image = ProductImage::query()->create([
            'product_id' => $product->id,
            'media_file_id' => $media->id,
            'sort_order' => 1,
        ]);

        VisualIndexEntry::query()->create([
            'id' => (string) Str::uuid(),
            'product_id' => $product->id,
            'product_image_id' => $image->id,
            'media_file_id' => $media->id,
            'hash_bits' => $queryHash,
            'hash_bucket' => VisualHashBits::bucketFromHashBits($queryHash),
            'engine_version' => config('diyar.visual_search.engine_version'),
            'representation_version' => config('diyar.visual_search.representation_version'),
            'index_version' => config('diyar.visual_search.index_version'),
            'is_active' => false,
            'indexed_at' => now(),
        ]);

        $this->assertSame([], app(VisualCandidateRetriever::class)->retrieve($queryHash, 19));
    }
}
