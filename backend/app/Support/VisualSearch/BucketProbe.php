<?php

namespace App\Support\VisualSearch;

final class BucketProbe
{
    /**
     * All 12-bit prefix buckets within Hamming radius of the query bucket.
     *
     * @return list<int>
     */
    public static function probeBuckets(int $queryBucket, int $radius = 3, int $prefixBits = 12): array
    {
        $maxBucket = (1 << $prefixBits) - 1;
        $buckets = [];

        for ($candidate = 0; $candidate <= $maxBucket; $candidate++) {
            if (VisualHashBits::prefixHammingDistance($queryBucket, $candidate, $prefixBits) <= $radius) {
                $buckets[] = $candidate;
            }
        }

        return $buckets;
    }
}
