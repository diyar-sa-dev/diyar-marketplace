<?php

namespace App\Support\VisualSearch;

final class ProductSimilarityAggregator
{
    /**
     * @param  list<VisualSearchCandidate>  $candidates
     * @return list<VisualSearchCandidate>
     */
    public function aggregate(array $candidates): array
    {
        /** @var array<string, VisualSearchCandidate> $bestByProduct */
        $bestByProduct = [];

        foreach ($candidates as $candidate) {
            $existing = $bestByProduct[$candidate->productId] ?? null;

            if ($existing === null || $candidate->similarity > $existing->similarity) {
                $bestByProduct[$candidate->productId] = $candidate;

                continue;
            }

            if ($candidate->similarity === $existing->similarity
                && $candidate->hammingDistance < $existing->hammingDistance) {
                $bestByProduct[$candidate->productId] = $candidate;
            }
        }

        return array_values($bestByProduct);
    }
}
