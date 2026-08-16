<?php

namespace App\Services\Media;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;

final class MediaUploadService
{
    public function diskName(): string
    {
        return (string) config('diyar_media.disk', 'media');
    }

    public function maxUploadBytes(): int
    {
        return (int) config('diyar_media.max_upload_kb', 5120) * 1024;
    }

    /**
     * @return list<string>
     */
    public function allowedMimes(): array
    {
        return config('diyar_media.allowed_mimes', []);
    }

    public function validateImage(UploadedFile $file): void
    {
        if (! $file->isValid()) {
            throw new InvalidArgumentException(__('diyar.media.invalid_upload'));
        }

        if ($file->getSize() > $this->maxUploadBytes()) {
            throw new InvalidArgumentException(__('diyar.media.file_too_large'));
        }

        $detectedMime = $file->getMimeType();
        if (! in_array($detectedMime, $this->allowedMimes(), true)) {
            throw new InvalidArgumentException(__('diyar.media.invalid_type'));
        }

        $extension = strtolower((string) $file->getClientOriginalExtension());
        $allowedExtensions = config('diyar_media.allowed_extensions', []);
        if (! in_array($extension, $allowedExtensions, true)) {
            throw new InvalidArgumentException(__('diyar.media.invalid_extension'));
        }
    }

    public function storeUserAvatar(User $user, UploadedFile $file): string
    {
        $this->validateImage($file);

        $extension = $this->resolveExtension($file);
        $directory = sprintf(
            '%s/%s/avatar',
            config('diyar_media.avatar_directory', 'users'),
            $user->id,
        );
        $filename = Str::uuid()->toString().'.'.$extension;
        $path = $directory.'/'.$filename;

        $stored = Storage::disk($this->diskName())->putFileAs($directory, $file, $filename);
        if ($stored === false) {
            throw new RuntimeException(__('diyar.media.upload_failed'));
        }

        return $path;
    }

    public function deletePath(?string $path): void
    {
        if ($path === null || $path === '') {
            return;
        }

        $disk = Storage::disk($this->diskName());
        if ($disk->exists($path)) {
            $disk->delete($path);
        }
    }

    public function url(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        return Storage::disk($this->diskName())->url($path);
    }

    private function resolveExtension(UploadedFile $file): string
    {
        return match ($file->getMimeType()) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            default => throw new InvalidArgumentException(__('diyar.media.invalid_type')),
        };
    }
}
