<?php

namespace App\Services\Visualization\Support;

use App\Models\TryInRoomJob;
use App\Models\TryInRoomSourceImage;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

final class TryInRoomPrivateImageReader
{
    /**
     * @return array{bytes: string, mime: string, width: int, height: int}
     */
    public function readSourceForJob(TryInRoomJob $job): array
    {
        $job->loadMissing('sourceImage');
        $source = $job->sourceImage;
        if (! $source instanceof TryInRoomSourceImage) {
            throw new InvalidArgumentException('source_missing');
        }

        return $this->readSource($source);
    }

    /**
     * @return array{bytes: string, mime: string, width: int, height: int}
     */
    public function readSource(TryInRoomSourceImage $source): array
    {
        $maxBytes = (int) config('diyar.try_in_room.max_upload_kb', 8192) * 1024;
        $size = (int) ($source->size_bytes ?? 0);
        if ($size <= 0 || $size > $maxBytes) {
            throw new InvalidArgumentException('source_invalid_size');
        }

        if (! Storage::disk($source->disk)->exists($source->path)) {
            throw new InvalidArgumentException('source_missing');
        }

        $bytes = Storage::disk($source->disk)->get($source->path);
        if (! is_string($bytes) || $bytes === '') {
            throw new InvalidArgumentException('source_missing');
        }

        if (strlen($bytes) > $maxBytes) {
            throw new InvalidArgumentException('source_invalid_size');
        }

        return [
            'bytes' => $bytes,
            'mime' => (string) $source->mime,
            'width' => (int) $source->width_px,
            'height' => (int) $source->height_px,
        ];
    }
}
