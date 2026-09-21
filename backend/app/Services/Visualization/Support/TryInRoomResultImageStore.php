<?php

namespace App\Services\Visualization\Support;

use App\Models\TryInRoomJob;
use GdImage;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;

final class TryInRoomResultImageStore
{
    public function storePngForJob(TryInRoomJob $job, string $rawBytes): string
    {
        $maxBytes = (int) config('diyar.visualization.max_result_bytes', 12 * 1024 * 1024);
        if ($rawBytes === '' || strlen($rawBytes) > $maxBytes) {
            throw new InvalidArgumentException('result_invalid_size');
        }

        $this->assertPngBytes($rawBytes);

        $userId = (string) $job->user_id;
        if ($userId === '' || str_contains($userId, '..') || str_contains($userId, '/') || str_contains($userId, '\\')) {
            throw new InvalidArgumentException('result_invalid_owner');
        }

        $disk = (string) config('diyar.try_in_room.disk', 'try_in_room');
        $relativePath = sprintf('%s/results/%s.png', $userId, (string) Str::uuid());

        $stored = Storage::disk($disk)->put($relativePath, $rawBytes);
        if ($stored !== true) {
            throw new InvalidArgumentException('result_storage_failed');
        }

        return $relativePath;
    }

    private function assertPngBytes(string $rawBytes): void
    {
        if (! extension_loaded('gd')) {
            if (! str_starts_with($rawBytes, "\x89PNG\r\n\x1a\n")) {
                throw new InvalidArgumentException('result_invalid_format');
            }

            return;
        }

        $image = @imagecreatefromstring($rawBytes);
        if (! $image instanceof GdImage) {
            throw new InvalidArgumentException('result_invalid_format');
        }

        imagedestroy($image);
    }
}
