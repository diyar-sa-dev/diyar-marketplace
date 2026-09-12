<?php

namespace Tests\Unit\Support\VisualSearch;

use App\Support\VisualSearch\ProductSimilarityAggregator;
use App\Support\VisualSearch\VisualSearchCandidate;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProductSimilarityAggregatorTest extends TestCase
{
    #[Test]
    public function keeps_max_similarity_per_product(): void
    {
        $productId = 'product-a';
        $candidates = [
            new VisualSearchCandidate($productId, 'img-1', 'media-1', 10, 0.75),
            new VisualSearchCandidate($productId, 'img-2', 'media-2', 5, 0.90),
            new VisualSearchCandidate($productId, 'img-3', 'media-3', 8, 0.80),
        ];

        $aggregated = (new ProductSimilarityAggregator)->aggregate($candidates);

        $this->assertCount(1, $aggregated);
        $this->assertSame('img-2', $aggregated[0]->productImageId);
        $this->assertSame(0.90, $aggregated[0]->similarity);
    }

    #[Test]
    public function preserves_distinct_products(): void
    {
        $candidates = [
            new VisualSearchCandidate('p1', 'img-1', 'media-1', 3, 0.95),
            new VisualSearchCandidate('p2', 'img-2', 'media-2', 4, 0.88),
            new VisualSearchCandidate('p3', 'img-3', 'media-3', 5, 0.77),
        ];

        $aggregated = (new ProductSimilarityAggregator)->aggregate($candidates);

        $this->assertCount(3, $aggregated);
    }

    #[Test]
    public function tie_breaks_on_lower_hamming_distance(): void
    {
        $productId = 'product-b';
        $candidates = [
            new VisualSearchCandidate($productId, 'img-1', 'media-1', 8, 0.85),
            new VisualSearchCandidate($productId, 'img-2', 'media-2', 5, 0.85),
        ];

        $aggregated = (new ProductSimilarityAggregator)->aggregate($candidates);

        $this->assertSame('img-2', $aggregated[0]->productImageId);
    }
}
