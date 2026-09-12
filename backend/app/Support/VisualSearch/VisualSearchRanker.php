<?php

namespace App\Support\VisualSearch;

final class VisualSearchRanker
{
    /**
     * @param  list<VisualSearchCandidate>  $candidates
     * @return list<VisualSearchCandidate>
     */
    public function rank(array $candidates): array
    {
        usort($candidates, static function (VisualSearchCandidate $a, VisualSearchCandidate $b): int {
            $similarityCompare = $b->similarity <=> $a->similarity;
            if ($similarityCompare !== 0) {
                return $similarityCompare;
            }

            $distanceCompare = $a->hammingDistance <=> $b->hammingDistance;
            if ($distanceCompare !== 0) {
                return $distanceCompare;
            }

            return strcmp($a->productId, $b->productId);
        });

        return $candidates;
    }
}
