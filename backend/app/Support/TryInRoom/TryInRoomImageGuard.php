<?php

namespace App\Support\TryInRoom;

use Illuminate\Http\UploadedFile;
use InvalidArgumentException;

final class TryInRoomImageGuard
{
    public static function assertSafeUpload(UploadedFile $file): void
    {
        if (! $file->isValid()) {
            throw new InvalidArgumentException(__('diyar.try_in_room.invalid_upload'));
        }

        $maxBytes = (int) config('diyar.try_in_room.max_upload_kb', 8192) * 1024;
        if ($file->getSize() > $maxBytes) {
            throw new InvalidArgumentException(__('diyar.try_in_room.file_too_large'));
        }

        $allowedMimes = config('diyar.try_in_room.allowed_mimes', []);
        $mime = (string) $file->getMimeType();
        if (! in_array($mime, $allowedMimes, true)) {
            throw new InvalidArgumentException(__('diyar.try_in_room.invalid_type'));
        }

        $extension = strtolower((string) $file->getClientOriginalExtension());
        $allowedExtensions = config('diyar.try_in_room.allowed_extensions', []);
        if (! in_array($extension, $allowedExtensions, true)) {
            throw new InvalidArgumentException(__('diyar.try_in_room.invalid_extension'));
        }

        $path = $file->getRealPath();
        if ($path === false || $path === '') {
            throw new InvalidArgumentException(__('diyar.try_in_room.invalid_upload'));
        }

        $imageInfo = @getimagesize($path);
        if ($imageInfo === false) {
            throw new InvalidArgumentException(__('diyar.try_in_room.invalid_type'));
        }

        $detectedMime = image_type_to_mime_type($imageInfo[2]);
        if (! in_array($detectedMime, $allowedMimes, true)) {
            throw new InvalidArgumentException(__('diyar.try_in_room.invalid_type'));
        }

        $width = (int) ($imageInfo[0] ?? 0);
        $height = (int) ($imageInfo[1] ?? 0);
        if ($width <= 0 || $height <= 0) {
            throw new InvalidArgumentException(__('diyar.try_in_room.invalid_dimensions'));
        }

        $maxDimension = (int) config('diyar.try_in_room.max_dimension_px', 8192);
        $maxPixels = (int) config('diyar.try_in_room.max_pixels', 33_000_000);

        if ($width > $maxDimension || $height > $maxDimension) {
            throw new InvalidArgumentException(__('diyar.try_in_room.dimensions_exceeded'));
        }

        if (($width * $height) > $maxPixels) {
            throw new InvalidArgumentException(__('diyar.try_in_room.pixel_count_exceeded'));
        }
    }

    public static function extensionForMime(string $mime): string
    {
        return match ($mime) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            default => 'bin',
        };
    }
}
