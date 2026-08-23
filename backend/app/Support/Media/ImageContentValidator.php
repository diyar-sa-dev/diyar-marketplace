<?php

namespace App\Support\Media;

use Illuminate\Http\UploadedFile;
use InvalidArgumentException;

/**
 * Verifies raster image uploads using binary content, not client-supplied MIME alone.
 */
final class ImageContentValidator
{
    public static function assertRasterImage(UploadedFile $file, string $expectedMime): void
    {
        if ($expectedMime === 'image/svg+xml') {
            return;
        }

        $path = $file->getRealPath();
        if ($path === false || $path === '') {
            throw new InvalidArgumentException(__('diyar.media.invalid_upload'));
        }

        $imageInfo = @getimagesize($path);
        if ($imageInfo === false) {
            throw new InvalidArgumentException(__('diyar.media.invalid_type'));
        }

        $detectedMime = image_type_to_mime_type($imageInfo[2]);
        if ($detectedMime !== $expectedMime) {
            throw new InvalidArgumentException(__('diyar.media.invalid_type'));
        }
    }
}
