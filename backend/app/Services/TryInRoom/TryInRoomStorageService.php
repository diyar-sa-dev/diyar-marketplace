<?php

namespace App\Services\TryInRoom;

use App\Models\TryInRoomSourceImage;
use App\Models\User;
use App\Support\TryInRoom\TryInRoomImageGuard;
use GdImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;

final class TryInRoomStorageService
{
    public function disk(): string
    {
        return (string) config('diyar.try_in_room.disk', 'try_in_room');
    }

    public function storeUpload(User $user, UploadedFile $file): TryInRoomSourceImage
    {
        TryInRoomImageGuard::assertSafeUpload($file);

        $path = $file->getRealPath();
        $imageInfo = getimagesize($path ?: '');
        $width = (int) ($imageInfo[0] ?? 0);
        $height = (int) ($imageInfo[1] ?? 0);
        $mime = image_type_to_mime_type($imageInfo[2] ?? 0);
        $extension = TryInRoomImageGuard::extensionForMime($mime);

        $raw = file_get_contents($path ?: '');
        if ($raw === false) {
            throw new InvalidArgumentException(__('diyar.try_in_room.invalid_upload'));
        }

        [$encoded, $storedMime] = $this->reencodeStripMetadata($raw, $mime);
        $extension = TryInRoomImageGuard::extensionForMime($storedMime);

        $imageId = (string) Str::uuid();
        $relativePath = sprintf('%s/%s.%s', $user->id, $imageId, $extension);

        $stored = Storage::disk($this->disk())->put($relativePath, $encoded);
        if ($stored !== true) {
            throw new \RuntimeException(__('diyar.try_in_room.storage_failed'));
        }

        return TryInRoomSourceImage::query()->create([
            'user_id' => $user->id,
            'disk' => $this->disk(),
            'path' => $relativePath,
            'mime' => $storedMime,
            'width_px' => $width,
            'height_px' => $height,
            'size_bytes' => strlen($encoded),
        ]);
    }

    public function sourceObjectExists(TryInRoomSourceImage $source): bool
    {
        return Storage::disk($source->disk)->exists($source->path);
    }

    /**
     * Re-encode through GD to drop EXIF and other metadata before private storage.
     *
     * @return array{0: string, 1: string} bytes and mime
     */
    private function reencodeStripMetadata(string $raw, string $mime): array
    {
        if (! extension_loaded('gd')) {
            return [$raw, $mime];
        }

        $image = @imagecreatefromstring($raw);
        if (! $image instanceof GdImage) {
            throw new InvalidArgumentException(__('diyar.try_in_room.invalid_type'));
        }

        ob_start();
        $ok = match ($mime) {
            'image/jpeg' => imagejpeg($image, null, 90),
            'image/png' => imagepng($image, null, 6),
            'image/webp' => function_exists('imagewebp') ? imagewebp($image, null, 90) : false,
            default => false,
        };
        imagedestroy($image);
        $encoded = (string) ob_get_clean();

        if ($ok !== true || $encoded === '') {
            throw new InvalidArgumentException(__('diyar.try_in_room.invalid_type'));
        }

        return [$encoded, $mime];
    }
}
