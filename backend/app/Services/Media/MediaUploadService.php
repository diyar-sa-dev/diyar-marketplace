<?php

namespace App\Services\Media;

use App\Models\MediaFile;
use App\Models\User;
use App\Support\Media\ImageContentValidator;
use App\Support\Media\SvgSafetyValidator;
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

        ImageContentValidator::assertRasterImage($file, (string) $detectedMime);

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

    public function storeVendorLogo(string $vendorAccountId, UploadedFile $file): string
    {
        $this->validateVendorLogo($file);

        $extension = $this->resolveVendorLogoExtension($file);
        $directory = sprintf(
            '%s/%s/logo',
            config('diyar_media.vendor_directory', 'vendors'),
            $vendorAccountId,
        );
        $filename = Str::uuid()->toString().'.'.$extension;
        $path = $directory.'/'.$filename;

        if ($extension === 'svg') {
            $contents = file_get_contents($file->getRealPath() ?: '');
            if ($contents === false) {
                throw new InvalidArgumentException(__('diyar.media.invalid_upload'));
            }
            SvgSafetyValidator::assertSafe($contents);
            $stored = Storage::disk($this->diskName())->put($path, $contents);
        } else {
            $stored = Storage::disk($this->diskName())->putFileAs($directory, $file, $filename);
        }

        if ($stored === false) {
            throw new RuntimeException(__('diyar.media.upload_failed'));
        }

        return $path;
    }

    public function storeVendorCover(string $vendorAccountId, UploadedFile $file): string
    {
        $this->validateVendorCover($file);

        $extension = $this->resolveVendorCoverExtension($file);
        $directory = sprintf(
            '%s/%s/cover',
            config('diyar_media.vendor_directory', 'vendors'),
            $vendorAccountId,
        );
        $filename = Str::uuid()->toString().'.'.$extension;
        $path = $directory.'/'.$filename;

        $stored = Storage::disk($this->diskName())->putFileAs($directory, $file, $filename);
        if ($stored === false) {
            throw new RuntimeException(__('diyar.media.upload_failed'));
        }

        return $path;
    }

    public function storeProviderAvatar(string $providerAccountId, UploadedFile $file): string
    {
        $this->validateImage($file);

        $extension = $this->resolveExtension($file);
        $directory = sprintf('providers/%s/avatar', $providerAccountId);
        $filename = Str::uuid()->toString().'.'.$extension;
        $path = $directory.'/'.$filename;

        $stored = Storage::disk($this->diskName())->putFileAs($directory, $file, $filename);
        if ($stored === false) {
            throw new RuntimeException(__('diyar.media.upload_failed'));
        }

        return $path;
    }

    public function storeServiceCover(string $serviceId, UploadedFile $file): string
    {
        $this->validateImage($file);

        $extension = $this->resolveExtension($file);
        $directory = sprintf('services/%s/cover', $serviceId);
        $filename = Str::uuid()->toString().'.'.$extension;
        $path = $directory.'/'.$filename;

        $stored = Storage::disk($this->diskName())->putFileAs($directory, $file, $filename);
        if ($stored === false) {
            throw new RuntimeException(__('diyar.media.upload_failed'));
        }

        return $path;
    }

    public function storeCmsImage(User $user, UploadedFile $file, string $directory): string
    {
        $this->validateImage($file);

        $extension = $this->resolveExtension($file);
        $directory = trim($directory, '/');
        $filename = Str::uuid()->toString().'.'.$extension;
        $path = $directory.'/'.$filename;

        $stored = Storage::disk($this->diskName())->putFileAs($directory, $file, $filename);
        if ($stored === false) {
            throw new RuntimeException(__('diyar.media.upload_failed'));
        }

        return $path;
    }

    public function storeProductImage(User $user, string $productId, UploadedFile $file): MediaFile
    {
        $this->validateImage($file);

        $extension = $this->resolveExtension($file);
        $directory = sprintf('products/%s', $productId);
        $filename = Str::uuid()->toString().'.'.$extension;
        $path = $directory.'/'.$filename;

        $stored = Storage::disk($this->diskName())->putFileAs($directory, $file, $filename);
        if ($stored === false) {
            throw new RuntimeException(__('diyar.media.upload_failed'));
        }

        return MediaFile::query()->create([
            'disk' => $this->diskName(),
            'path' => $path,
            'mime_type' => (string) $file->getMimeType(),
            'size_bytes' => (int) $file->getSize(),
            'uploaded_by' => $user->id,
        ]);
    }

    public function deleteMediaFile(?MediaFile $mediaFile): void
    {
        if ($mediaFile === null) {
            return;
        }

        $this->deletePath($mediaFile->path);
        $mediaFile->delete();
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

        $disk = Storage::disk($this->diskName());

        if (! $disk->exists($path)) {
            return null;
        }

        return $disk->url($path);
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

    public function validateVendorLogo(UploadedFile $file): void
    {
        $this->validateUploadedFile(
            $file,
            (int) config('diyar_media.vendor_logo_max_kb', 2048) * 1024,
            config('diyar_media.vendor_logo_mimes', []),
            config('diyar_media.vendor_logo_extensions', []),
        );
    }

    public function validateVendorCover(UploadedFile $file): void
    {
        $this->validateUploadedFile(
            $file,
            (int) config('diyar_media.vendor_cover_max_kb', 5120) * 1024,
            config('diyar_media.vendor_cover_mimes', []),
            config('diyar_media.vendor_cover_extensions', []),
        );
    }

    /**
     * @param  list<string>  $allowedMimes
     * @param  list<string>  $allowedExtensions
     */
    private function validateUploadedFile(
        UploadedFile $file,
        int $maxBytes,
        array $allowedMimes,
        array $allowedExtensions,
    ): void {
        if (! $file->isValid()) {
            throw new InvalidArgumentException(__('diyar.media.invalid_upload'));
        }

        if ($file->getSize() > $maxBytes) {
            throw new InvalidArgumentException(__('diyar.media.file_too_large'));
        }

        $detectedMime = $file->getMimeType();
        if (! in_array($detectedMime, $allowedMimes, true)) {
            throw new InvalidArgumentException(__('diyar.media.invalid_type'));
        }

        if ($detectedMime !== 'image/svg+xml') {
            ImageContentValidator::assertRasterImage($file, (string) $detectedMime);
        }

        $extension = strtolower((string) $file->getClientOriginalExtension());
        if (! in_array($extension, $allowedExtensions, true)) {
            throw new InvalidArgumentException(__('diyar.media.invalid_extension'));
        }
    }

    private function resolveVendorLogoExtension(UploadedFile $file): string
    {
        return match ($file->getMimeType()) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/svg+xml' => 'svg',
            default => throw new InvalidArgumentException(__('diyar.media.invalid_type')),
        };
    }

    private function resolveVendorCoverExtension(UploadedFile $file): string
    {
        return $this->resolveExtension($file);
    }
}
