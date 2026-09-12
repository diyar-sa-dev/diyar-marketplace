<?php

declare(strict_types=1);

/**
 * Isolated Phase 3 benchmark fixtures — NOT production code.
 */
final class FixtureGenerator
{
    public static function ensureDirectory(string $dir): void
    {
        if (! is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
    }

    /**
     * @return array<string, string> label => path
     */
    public static function generateAll(string $dir): array
    {
        self::ensureDirectory($dir);
        $paths = [];

        $paths['base_square'] = self::savePattern($dir, 'base_square.jpg', 800, 800, 'product_a');
        $paths['base_landscape'] = self::savePattern($dir, 'base_landscape.jpg', 1600, 900, 'product_b');
        $paths['base_portrait'] = self::savePattern($dir, 'base_portrait.jpg', 900, 1600, 'product_c');
        $paths['small'] = self::savePattern($dir, 'small.jpg', 120, 120, 'small');
        $paths['medium'] = self::savePattern($dir, 'medium.jpg', 800, 600, 'medium');
        $paths['large'] = self::savePattern($dir, 'large.jpg', 4000, 3000, 'large');
        $paths['high_res'] = self::savePattern($dir, 'high_res.jpg', 3000, 2000, 'hires');

        $paths['resized'] = self::resizeCopy($paths['base_square'], $dir.'/resized.jpg', 400, 400);
        $paths['recompressed'] = self::recompress($paths['base_square'], $dir.'/recompressed.jpg', 35);
        $paths['brightness'] = self::adjustBrightness($paths['base_square'], $dir.'/brightness.jpg', 25);
        $paths['cropped'] = self::crop($paths['base_square'], $dir.'/cropped.jpg', 0.1, 0.1, 0.8, 0.8);

        $paths['negative_different'] = self::savePattern($dir, 'negative_different.jpg', 800, 800, 'product_z');
        $paths['negative_similar_palette'] = self::savePattern($dir, 'negative_similar_palette.jpg', 800, 800, 'product_a_variant');

        foreach (['jpg' => 'jpeg', 'png' => 'png', 'webp' => 'webp'] as $ext => $fn) {
            $paths['format_'.$ext] = self::export($paths['base_square'], $dir.'/format.'.$ext, $fn);
        }

        return $paths;
    }

    private static function savePattern(string $dir, string $filename, int $w, int $h, string $seed): string
    {
        $image = imagecreatetruecolor($w, $h);
        if ($image === false) {
            throw new RuntimeException('Failed to create image');
        }

        $hash = crc32($seed);
        for ($y = 0; $y < $h; $y++) {
            for ($x = 0; $x < $w; $x++) {
                $r = ($x * 3 + $hash) % 256;
                $g = ($y * 5 + ($hash >> 8)) % 256;
                $b = (($x + $y) * 7 + ($hash >> 16)) % 256;
                $color = imagecolorallocate($image, $r, $g, $b);
                imagesetpixel($image, $x, $y, $color);
            }
        }

        self::drawMarker($image, $seed, $w, $h);

        $path = $dir.'/'.$filename;
        if (! imagejpeg($image, $path, 85)) {
            imagedestroy($image);
            throw new RuntimeException('Failed to write '.$path);
        }

        imagedestroy($image);

        return $path;
    }

    private static function drawMarker(\GdImage $image, string $seed, int $w, int $h): void
    {
        $white = imagecolorallocate($image, 255, 255, 255);
        $black = imagecolorallocate($image, 0, 0, 0);
        $boxW = max(40, (int) ($w * 0.2));
        $boxH = max(40, (int) ($h * 0.2));
        $x = (int) (($w - $boxW) / 2);
        $y = (int) (($h - $boxH) / 2);
        imagefilledrectangle($image, $x, $y, $x + $boxW, $y + $boxH, $white);
        imagestring($image, 5, $x + 8, $y + 8, substr($seed, 0, 8), $black);
    }

    private static function resizeCopy(string $source, string $dest, int $w, int $h): string
    {
        $src = imagecreatefromjpeg($source);
        $dst = imagecreatetruecolor($w, $h);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $w, $h, imagesx($src), imagesy($src));
        imagejpeg($dst, $dest, 85);
        imagedestroy($src);
        imagedestroy($dst);

        return $dest;
    }

    private static function recompress(string $source, string $dest, int $quality): string
    {
        copy($source, $dest);
        $img = imagecreatefromjpeg($dest);
        imagejpeg($img, $dest, $quality);
        imagedestroy($img);

        return $dest;
    }

    private static function adjustBrightness(string $source, string $dest, int $level): string
    {
        $img = imagecreatefromjpeg($source);
        imagefilter($img, IMG_FILTER_BRIGHTNESS, $level);
        imagejpeg($img, $dest, 85);
        imagedestroy($img);

        return $dest;
    }

    /**
     * @param float $x Start fraction
     * @param float $y Start fraction
     * @param float $w Width fraction
     * @param float $h Height fraction
     */
    private static function crop(string $source, string $dest, float $x, float $y, float $w, float $h): string
    {
        $src = imagecreatefromjpeg($source);
        $srcW = imagesx($src);
        $srcH = imagesy($src);
        $cropX = (int) ($srcW * $x);
        $cropY = (int) ($srcH * $y);
        $cropW = (int) ($srcW * $w);
        $cropH = (int) ($srcH * $h);
        $dst = imagecrop($src, ['x' => $cropX, 'y' => $cropY, 'width' => $cropW, 'height' => $cropH]);
        imagedestroy($src);
        if ($dst === false) {
            throw new RuntimeException('Crop failed');
        }
        imagejpeg($dst, $dest, 85);
        imagedestroy($dst);

        return $dest;
    }

    private static function export(string $source, string $dest, string $format): string
    {
        $img = imagecreatefromjpeg($source);

        $ok = match ($format) {
            'jpeg' => imagejpeg($img, $dest, 85),
            'png' => imagepng($img, $dest, 6),
            'webp' => imagewebp($img, $dest, 85),
            default => false,
        };

        imagedestroy($img);

        if (! $ok) {
            throw new RuntimeException('Export failed for '.$dest);
        }

        return $dest;
    }
}
