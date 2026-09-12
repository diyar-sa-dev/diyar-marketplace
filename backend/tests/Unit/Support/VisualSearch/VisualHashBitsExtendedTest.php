<?php

namespace Tests\Unit\Support\VisualSearch;

use App\Support\VisualSearch\VisualHashBits;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class VisualHashBitsExtendedTest extends TestCase
{
    #[Test]
    public function similarity_is_one_for_identical_hashes(): void
    {
        $hash = random_bytes(8);

        $this->assertSame(1.0, VisualHashBits::similarity($hash, $hash));
    }

    #[Test]
    public function similarity_decreases_with_hamming_distance(): void
    {
        $a = "\0\0\0\0\0\0\0\0";
        $b = "\xFF\0\0\0\0\0\0\0";

        $this->assertLessThan(VisualHashBits::similarity($a, $a), VisualHashBits::similarity($a, $b));
    }

    #[Test]
    public function bucket_from_hash_bits_uses_top_twelve_bits(): void
    {
        $hash = hex2bin('0ABC000000000000');
        $bucket = VisualHashBits::bucketFromHashBits($hash);

        $this->assertSame(0xAB, $bucket);
    }
}
