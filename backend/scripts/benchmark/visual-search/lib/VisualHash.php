<?php

declare(strict_types=1);

/**
 * Isolated Phase 3 benchmark — NOT production code.
 * GD-native dHash-64 with locked normalization: letterbox 256×256 grayscale → 9×8 dHash.
 */
final class VisualHash
{
    public const WORKING_DIMENSION = 256;

    public const DHASH_WIDTH = 9;

    public const DHASH_HEIGHT = 8;

    /** @var array<int, int> */
    private static array $popcount = [];

    public static function popcountInit(): void
    {
        if (self::$popcount !== []) {
            return;
        }

        for ($i = 0; $i < 256; $i++) {
            self::$popcount[$i] = substr_count(decbin($i), '1');
        }
    }

    /**
     * @return array{
     *   hash_bits: string,
     *   hash_bucket: int,
     *   decode_ms: float,
     *   normalize_ms: float,
     *   hash_ms: float,
     *   total_ms: float,
     *   peak_memory_bytes: int,
     *   width: int,
     *   height: int
     * }
     */
    public static function fromFile(string $path): array
    {
        self::popcountInit();
        $peakBefore = memory_get_peak_usage(true);

        $decodeStart = hrtime(true);
        $image = self::decode($path);
        $decodeMs = (hrtime(true) - $decodeStart) / 1_000_000;

        $width = imagesx($image);
        $height = imagesy($image);

        $normalizeStart = hrtime(true);
        $normalized = self::normalize256Grayscale($image);
        imagedestroy($image);
        $normalizeMs = (hrtime(true) - $normalizeStart) / 1_000_000;

        $hashStart = hrtime(true);
        $hashBits = self::dHashFromNormalized($normalized);
        imagedestroy($normalized);
        $hashMs = (hrtime(true) - $hashStart) / 1_000_000;

        $peakAfter = memory_get_peak_usage(true);

        return [
            'hash_bits' => $hashBits,
            'hash_bucket' => self::bucketFromHashBits($hashBits),
            'decode_ms' => $decodeMs,
            'normalize_ms' => $normalizeMs,
            'hash_ms' => $hashMs,
            'total_ms' => $decodeMs + $normalizeMs + $hashMs,
            'peak_memory_bytes' => max($peakAfter - $peakBefore, 0),
            'width' => $width,
            'height' => $height,
        ];
    }

    public static function decode(string $path): \GdImage
    {
        $info = @getimagesize($path);
        if ($info === false) {
            throw new RuntimeException('Invalid image: '.$path);
        }

        $image = match ($info[2]) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
            IMAGETYPE_PNG => @imagecreatefrompng($path),
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false,
            default => false,
        };

        if ($image === false) {
            throw new RuntimeException('GD decode failed: '.$path);
        }

        return $image;
    }

    public static function normalize256Grayscale(\GdImage $source): \GdImage
    {
        $srcW = imagesx($source);
        $srcH = imagesy($source);
        $dim = self::WORKING_DIMENSION;

        $scale = min($dim / $srcW, $dim / $srcH);
        $targetW = max(1, (int) round($srcW * $scale));
        $targetH = max(1, (int) round($srcH * $scale));

        $canvas = imagecreatetruecolor($dim, $dim);
        if ($canvas === false) {
            throw new RuntimeException('Failed to allocate 256 canvas');
        }

        $bg = imagecolorallocate($canvas, 128, 128, 128);
        imagefill($canvas, 0, 0, $bg);

        $offsetX = (int) floor(($dim - $targetW) / 2);
        $offsetY = (int) floor(($dim - $targetH) / 2);

        imagecopyresampled(
            $canvas,
            $source,
            $offsetX,
            $offsetY,
            0,
            0,
            $targetW,
            $targetH,
            $srcW,
            $srcH,
        );

        imagefilter($canvas, IMG_FILTER_GRAYSCALE);

        return $canvas;
    }

    public static function dHashFromNormalized(\GdImage $normalized256): string
    {
        $small = imagecreatetruecolor(self::DHASH_WIDTH, self::DHASH_HEIGHT);
        if ($small === false) {
            throw new RuntimeException('Failed to allocate dHash canvas');
        }

        imagecopyresampled(
            $small,
            $normalized256,
            0,
            0,
            0,
            0,
            self::DHASH_WIDTH,
            self::DHASH_HEIGHT,
            self::WORKING_DIMENSION,
            self::WORKING_DIMENSION,
        );

        $bits = '';
        for ($y = 0; $y < self::DHASH_HEIGHT; $y++) {
            for ($x = 0; $x < self::DHASH_WIDTH - 1; $x++) {
                $left = imagecolorat($small, $x, $y) & 0xFF;
                $right = imagecolorat($small, $x + 1, $y) & 0xFF;
                $bits .= ($left < $right) ? '1' : '0';
            }
        }

        imagedestroy($small);

        if (strlen($bits) !== 64) {
            throw new RuntimeException('Unexpected dHash bit length: '.strlen($bits));
        }

        return self::bitsToBinaryString($bits);
    }

    public static function bitsToBinaryString(string $bits): string
    {
        $bytes = '';
        for ($i = 0; $i < 8; $i++) {
            $chunk = substr($bits, $i * 8, 8);
            $bytes .= chr((int) bindec($chunk));
        }

        return $bytes;
    }

    public static function binaryStringToBits(string $hashBits): string
    {
        $bits = '';
        for ($i = 0; $i < 8; $i++) {
            $bits .= str_pad(decbin(ord($hashBits[$i])), 8, '0', STR_PAD_LEFT);
        }

        return $bits;
    }

    public static function bucketFromHashBits(string $hashBits): int
    {
        if (strlen($hashBits) !== 8) {
            throw new InvalidArgumentException('hash_bits must be 8 bytes');
        }

        $b0 = ord($hashBits[0]);
        $b1 = ord($hashBits[1]);

        return ($b0 << 4) | ($b1 >> 4);
    }

    public static function hammingDistance(string $a, string $b): int
    {
        if (strlen($a) !== 8 || strlen($b) !== 8) {
            throw new InvalidArgumentException('hash_bits must be 8 bytes');
        }

        self::popcountInit();
        $xor = $a ^ $b;
        $distance = 0;

        for ($i = 0; $i < 8; $i++) {
            $distance += self::$popcount[ord($xor[$i])];
        }

        return $distance;
    }

    public static function similarity(string $a, string $b): float
    {
        return max(0.0, 1.0 - (self::hammingDistance($a, $b) / 64.0));
    }

    public static function queryFingerprint(string $hashBits, string $representationVersion): string
    {
        return hash('sha256', $hashBits.$representationVersion);
    }

    /**
     * @return list<int>
     */
    public static function neighborBuckets(int $bucket, int $maxNeighbors = 8): array
    {
        $buckets = [$bucket];

        for ($bit = 0; $bit < 12 && count($buckets) <= $maxNeighbors; $bit++) {
            $flipped = $bucket ^ (1 << (11 - $bit));
            if ($flipped >= 0 && $flipped <= 0xFFF && ! in_array($flipped, $buckets, true)) {
                $buckets[] = $flipped;
            }
        }

        return array_slice($buckets, 0, $maxNeighbors + 1);
    }
}
