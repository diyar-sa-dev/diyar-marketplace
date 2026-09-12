<?php

namespace Tests\Unit\Support\VisualSearch;

use App\Support\VisualSearch\VisualSearchCandidate;
use App\Support\VisualSearch\VisualSearchRanker;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class VisualSearchRankerTest extends TestCase
{
    #[Test]
    public function ranks_by_similarity_descending(): void
    {
        $candidates = [
            new VisualSearchCandidate('p-low', 'i1', 'm1', 15, 0.70),
            new VisualSearchCandidate('p-high', 'i2', 'm2', 2, 0.95),
            new VisualSearchCandidate('p-mid', 'i3', 'm3', 8, 0.82),
        ];

        $ranked = (new VisualSearchRanker)->rank($candidates);

        $this->assertSame(['p-high', 'p-mid', 'p-low'], array_map(fn ($c) => $c->productId, $ranked));
    }

    #[Test]
    public function tie_breaks_on_hamming_distance(): void
    {
        $candidates = [
            new VisualSearchCandidate('p-a', 'i1', 'm1', 10, 0.88),
            new VisualSearchCandidate('p-b', 'i2', 'm2', 5, 0.88),
        ];

        $ranked = (new VisualSearchRanker)->rank($candidates);

        $this->assertSame('p-b', $ranked[0]->productId);
    }
}
