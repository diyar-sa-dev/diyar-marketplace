<?php

namespace App\Support\VisualSearch;

use GdImage;
use InvalidArgumentException;
use RuntimeException;

final class Dhash64Generator
{
    private const DHASH_WIDTH = 9;

    private const DHASH_HEIGHT = 8;

    public function __construct(
        private readonly int $workingDimension = 256,
    ) {}

    public function fromFilePath(string $path): string
    {
        $image = $this->decode($path);
        $normalized = $this->normalize256Grayscale($image);
        imagedestroy($image);

        try {
            return $this->dHashFromNormalized($normalized);
        } finally {
            imagedestroy($normalized);
        }
    }

    public function decode(string $path): GdImage
    {
        $info = @getimagesize($path);
        if ($info === false) {
            throw new InvalidArgumentException(__('diyar.visual_search.invalid_image'));
        }

        $image = match ($info[2]) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
            IMAGETYPE_PNG => @imagecreatefrompng($path),
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false,
            default => false,
        };

        if ($image === false) {
            throw new InvalidArgumentException(__('diyar.visual_search.decode_failed'));
        }

        return $image;
    }

    public function normalize256Grayscale(GdImage $source): GdImage
    {
        $srcW = imagesx($source);
        $srcH = imagesy($source);
        $dim = $this->workingDimension;

        $scale = min($dim / $srcW, $dim / $srcH);
        $targetW = max(1, (int) round($srcW * $scale));
        $targetH = max(1, (int) round($srcH * $scale));

        $canvas = imagecreatetruecolor($dim, $dim);
        if ($canvas === false) {
            throw new RuntimeException('Failed to allocate normalization canvas.');
        }

        $bg = imagecolorallocate($canvas, 128, 128, 128);
        imagefill($canvas, 0, 0, $bg);

        imagecopyresampled(
            $canvas,
            $source,
            (int) floor(($dim - $targetW) / 2),
            (int) floor(($dim - $targetH) / 2),
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

    public function dHashFromNormalized(GdImage $normalized256): string
    {
        $small = imagecreatetruecolor(self::DHASH_WIDTH, self::DHASH_HEIGHT);
        if ($small === false) {
            throw new RuntimeException('Failed to allocate dHash canvas.');
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
            $this->workingDimension,
            $this->workingDimension,
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

        return $this->bitsToBinaryString($bits);
    }

    private function bitsToBinaryString(string $bits): string
    {
        if (strlen($bits) !== 64) {
            throw new RuntimeException('Unexpected dHash bit length.');
        }

        $bytes = '';
        for ($i = 0; $i < 8; $i++) {
            $bytes .= chr((int) bindec(substr($bits, $i * 8, 8)));
        }

        return $bytes;
    }
}
