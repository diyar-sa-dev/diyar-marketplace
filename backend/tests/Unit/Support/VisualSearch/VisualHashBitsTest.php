<?php

namespace Tests\Unit\Support\VisualSearch;

use App\Support\VisualSearch\BucketProbe;
use App\Support\VisualSearch\VisualHashBits;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class VisualHashBitsTest extends TestCase
{
    #[Test]
    public function hamming_distance_is_symmetric_and_deterministic(): void
    {
        $a = random_bytes(8);
        $b = random_bytes(8);

        $this->assertSame(
            VisualHashBits::hammingDistance($a, $b),
            VisualHashBits::hammingDistance($b, $a),
        );
        $this->assertSame(0, VisualHashBits::hammingDistance($a, $a));
    }

    #[Test]
    public function bucket_probe_uses_hamming_radius_three_not_single_neighbor(): void
    {
        $queryBucket = 578;
        $targetBucket = 64;

        $singleNeighborSet = [$queryBucket];
        for ($bit = 0; $bit < 12; $bit++) {
            $singleNeighborSet[] = $queryBucket ^ (1 << (11 - $bit));
        }

        $this->assertNotContains(
            $targetBucket,
            array_slice($singleNeighborSet, 0, 9),
            'Phase 3 disproved primary+8-neighbor recall for some positive pairs.',
        );

        $radiusThree = BucketProbe::probeBuckets($queryBucket, 3);
        $this->assertContains($targetBucket, $radiusThree);
        $this->assertGreaterThan(9, count($radiusThree));
    }

    #[Test]
    public function query_fingerprint_changes_with_representation_version(): void
    {
        $hash = random_bytes(8);

        $this->assertNotSame(
            VisualHashBits::queryFingerprint($hash, 'dhash-64-v1'),
            VisualHashBits::queryFingerprint($hash, 'dhash-64-v2'),
        );
    }
}
