<?php

namespace App\Support\VisualSearch;

use InvalidArgumentException;

final class VisualHashBits
{
    public const BYTE_LENGTH = 8;

    public const BIT_LENGTH = 64;

    /** @var array<int, int> */
    private static array $popcount = [];

    public static function bucketFromHashBits(string $hashBits): int
    {
        self::assertLength($hashBits);

        $b0 = ord($hashBits[0]);
        $b1 = ord($hashBits[1]);

        return ($b0 << 4) | ($b1 >> 4);
    }

    public static function hammingDistance(string $a, string $b): int
    {
        self::assertLength($a);
        self::assertLength($b);
        self::initPopcount();

        $xor = $a ^ $b;
        $distance = 0;

        for ($i = 0; $i < self::BYTE_LENGTH; $i++) {
            $distance += self::$popcount[ord($xor[$i])];
        }

        return $distance;
    }

    public static function similarity(string $a, string $b): float
    {
        return max(0.0, 1.0 - (self::hammingDistance($a, $b) / self::BIT_LENGTH));
    }

    public static function queryFingerprint(string $hashBits, string $representationVersion): string
    {
        self::assertLength($hashBits);

        return hash('sha256', $hashBits.$representationVersion);
    }

    public static function prefixHammingDistance(int $bucketA, int $bucketB, int $prefixBits = 12): int
    {
        $xor = $bucketA ^ $bucketB;
        $distance = 0;

        for ($bit = 0; $bit < $prefixBits; $bit++) {
            if (($xor & (1 << ($prefixBits - 1 - $bit))) !== 0) {
                $distance++;
            }
        }

        return $distance;
    }

    private static function assertLength(string $hashBits): void
    {
        if (strlen($hashBits) !== self::BYTE_LENGTH) {
            throw new InvalidArgumentException('hash_bits must be exactly 8 bytes.');
        }
    }

    private static function initPopcount(): void
    {
        if (self::$popcount !== []) {
            return;
        }

        for ($i = 0; $i < 256; $i++) {
            self::$popcount[$i] = substr_count(decbin($i), '1');
        }
    }
}
