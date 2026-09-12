<?php

namespace App\Support\VisualSearch;

final readonly class VisualSearchCandidate
{
    public function __construct(
        public string $productId,
        public string $productImageId,
        public string $mediaFileId,
        public int $hammingDistance,
        public float $similarity,
    ) {}
}
