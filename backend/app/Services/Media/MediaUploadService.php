<?php

namespace App\Services\Media;

use App\Models\MediaFile;
use App\Models\User;
use App\Support\Media\ImageContentValidator;
use App\Support\Media\OptimizedMedia;
use App\Support\Media\StoredMedia;
use App\Support\Media\SvgSafetyValidator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;

final class MediaUploadService
{
    public function __construct(
        private readonly MediaOptimizationService $optimizer,
    ) {}

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

        return $this->persistOptimizedRaster(
            sprintf('%s/%s/avatar', config('diyar_media.avatar_directory', 'users'), $user->id),
            $file,
            'avatar',
        )->path;
    }

    public function storeVendorLogo(string $vendorAccountId, UploadedFile $file): string
    {
        $this->validateVendorLogo($file);

        $directory = sprintf(
            '%s/%s/logo',
            config('diyar_media.vendor_directory', 'vendors'),
            $vendorAccountId,
        );

        if ($file->getMimeType() === 'image/svg+xml') {
            return $this->persistRawUpload($directory, $file, 'svg')->path;
        }

        return $this->persistOptimizedRaster($directory, $file, 'avatar')->path;
    }

    public function storeVendorCover(string $vendorAccountId, UploadedFile $file): string
    {
        $this->validateVendorCover($file);

        return $this->persistOptimizedRaster(
            sprintf('%s/%s/cover', config('diyar_media.vendor_directory', 'vendors'), $vendorAccountId),
            $file,
            'cover',
        )->path;
    }

    public function storeProviderAvatar(string $providerAccountId, UploadedFile $file): string
    {
        $this->validateImage($file);

        return $this->persistOptimizedRaster(
            sprintf('providers/%s/avatar', $providerAccountId),
            $file,
            'avatar',
        )->path;
    }

    public function storeServiceCover(string $serviceId, UploadedFile $file): string
    {
        $this->validateImage($file);

        return $this->persistOptimizedRaster(
            sprintf('services/%s/cover', $serviceId),
            $file,
            'cover',
        )->path;
    }

    public function storeCmsImage(User $user, UploadedFile $file, string $directory): string
    {
        unset($user);
        $this->validateImage($file);

        return $this->persistOptimizedRaster(trim($directory, '/'), $file, 'cover')->path;
    }

    public function storeCategoryImage(string $categoryId, UploadedFile $file): string
    {
        $this->validateImage($file);

        return $this->persistOptimizedRaster(
            sprintf('categories/%s', $categoryId),
            $file,
            'default',
        )->path;
    }

    public function storeProductImage(User $user, string $productId, UploadedFile $file): MediaFile
    {
        $this->validateImage($file);

        $stored = $this->persistOptimizedRaster(
            sprintf('products/%s', $productId),
            $file,
            'product',
        );

        return MediaFile::query()->create([
            'disk' => $this->diskName(),
            'path' => $stored->path,
            'mime_type' => $stored->mimeType,
            'size_bytes' => $stored->sizeBytes,
            'uploaded_by' => $user->id,
        ]);
    }

    /**
     * Shared entry for chat, returns, service-request attachments, quotations, etc.
     */
    public function storeAttachment(string $directory, UploadedFile $file, string $profile = 'default'): StoredMedia
    {
        $mime = (string) $file->getMimeType();

        if ($mime === 'application/pdf') {
            return $this->persistOptimizedPdf($directory, $file);
        }

        $this->validateImage($file);

        return $this->persistOptimizedRaster($directory, $file, $profile);
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

        if (preg_match('#^https?://#i', $path) === 1) {
            return $path;
        }

        $normalized = str_replace('\\', '/', ltrim($path, '/'));

        if (str_starts_with($normalized, 'storage/media/')) {
            return '/'.$normalized;
        }

        if (str_starts_with($normalized, 'storage/')) {
            return '/'.$normalized;
        }

        $disk = Storage::disk($this->diskName());

        if (! $disk->exists($normalized)) {
            return null;
        }

        // App-relative URLs work with the SPA proxy (/storage) regardless of APP_URL/LAN host.
        return '/storage/media/'.$normalized;
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

    private function persistOptimizedRaster(
        string $directory,
        UploadedFile $file,
        string $profile,
    ): StoredMedia {
        $optimized = $this->optimizer->optimizeRasterImage($file, $profile);

        return $this->writeOptimizedMedia($directory, $optimized);
    }

    private function persistOptimizedPdf(string $directory, UploadedFile $file): StoredMedia
    {
        $optimized = $this->optimizer->optimizePdf($file);

        return $this->writeOptimizedMedia($directory, $optimized);
    }

    private function persistRawUpload(string $directory, UploadedFile $file, string $extension): StoredMedia
    {
        $contents = (string) file_get_contents($file->getRealPath() ?: '');
        if ($extension === 'svg') {
            SvgSafetyValidator::assertSafe($contents);
        }

        $filename = Str::uuid()->toString().'.'.$extension;
        $path = trim($directory, '/').'/'.$filename;

        $stored = Storage::disk($this->diskName())->put($path, $contents);
        if ($stored === false) {
            throw new RuntimeException(__('diyar.media.upload_failed'));
        }

        return new StoredMedia(
            path: $path,
            mimeType: (string) $file->getMimeType(),
            sizeBytes: strlen($contents),
            extension: $extension,
        );
    }

    private function writeOptimizedMedia(string $directory, OptimizedMedia $optimized): StoredMedia
    {
        $directory = trim($directory, '/');
        $filename = Str::uuid()->toString().'.'.$optimized->extension;
        $path = $directory.'/'.$filename;

        $stored = Storage::disk($this->diskName())->put($path, $optimized->contents);
        if ($stored === false) {
            throw new RuntimeException(__('diyar.media.upload_failed'));
        }

        return new StoredMedia(
            path: $path,
            mimeType: $optimized->mimeType,
            sizeBytes: $optimized->sizeBytes,
            extension: $optimized->extension,
        );
    }
}
