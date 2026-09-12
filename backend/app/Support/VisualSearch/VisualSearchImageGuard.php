<?php

namespace App\Support\VisualSearch;

use Illuminate\Http\UploadedFile;
use InvalidArgumentException;

final class VisualSearchImageGuard
{
    public static function assertSafeUpload(UploadedFile $file): void
    {
        if (! $file->isValid()) {
            throw new InvalidArgumentException(__('diyar.visual_search.invalid_upload'));
        }

        $maxBytes = (int) config('diyar.visual_search.max_upload_kb', 2048) * 1024;
        if ($file->getSize() > $maxBytes) {
            throw new InvalidArgumentException(__('diyar.visual_search.file_too_large'));
        }

        $mime = (string) $file->getMimeType();
        $allowedMimes = config('diyar.visual_search.allowed_mimes', []);
        if (! in_array($mime, $allowedMimes, true)) {
            throw new InvalidArgumentException(__('diyar.visual_search.invalid_type'));
        }

        $extension = strtolower((string) $file->getClientOriginalExtension());
        $allowedExtensions = config('diyar.visual_search.allowed_extensions', []);
        if (! in_array($extension, $allowedExtensions, true)) {
            throw new InvalidArgumentException(__('diyar.visual_search.invalid_extension'));
        }

        $path = $file->getRealPath();
        if ($path === false || $path === '') {
            throw new InvalidArgumentException(__('diyar.visual_search.invalid_upload'));
        }

        $imageInfo = @getimagesize($path);
        if ($imageInfo === false) {
            throw new InvalidArgumentException(__('diyar.visual_search.invalid_type'));
        }

        $detectedMime = image_type_to_mime_type($imageInfo[2]);
        if (! in_array($detectedMime, $allowedMimes, true)) {
            throw new InvalidArgumentException(__('diyar.visual_search.invalid_type'));
        }

        $width = (int) ($imageInfo[0] ?? 0);
        $height = (int) ($imageInfo[1] ?? 0);
        if ($width <= 0 || $height <= 0) {
            throw new InvalidArgumentException(__('diyar.visual_search.invalid_dimensions'));
        }

        // Reject decompression-bomb style uploads while allowing typical phone camera photos.
        // The hash pipeline downscales to working_dimension_px before matching.
        $maxDimension = (int) config('diyar.visual_search.max_dimension_px', 8192);
        $maxPixels = (int) config('diyar.visual_search.max_pixels', 33_000_000);

        if ($width > $maxDimension || $height > $maxDimension) {
            throw new InvalidArgumentException(__('diyar.visual_search.dimensions_exceeded'));
        }

        if (($width * $height) > $maxPixels) {
            throw new InvalidArgumentException(__('diyar.visual_search.pixel_count_exceeded'));
        }
    }
}
