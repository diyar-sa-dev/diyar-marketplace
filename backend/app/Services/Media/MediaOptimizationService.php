<?php

namespace App\Services\Media;

use App\Support\Media\OptimizedMedia;
use App\Services\Settings\EffectiveConfigService;
use GdImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;
use Throwable;

final class MediaOptimizationService
{
    private ?string $ghostscriptBinary = null;

    private bool $ghostscriptResolved = false;

    public function __construct(
        private readonly EffectiveConfigService $config,
    ) {}

    public function isEnabled(): bool
    {
        return $this->config->boolean(
            'platform.media_optimize_enabled',
            (bool) config('diyar_media.optimization.enabled', true),
        );
    }

    public function isPdfOptimizationEnabled(): bool
    {
        return $this->config->boolean(
            'platform.media_optimize_pdf',
            (bool) config('diyar_media.optimization.pdf.enabled', true),
        );
    }

    public function webpQuality(): int
    {
        return max(1, min(100, $this->config->integer(
            'platform.media_webp_quality',
            (int) config('diyar_media.optimization.webp_quality', 82),
        )));
    }

    public function pdfQualityPreset(): string
    {
        $preset = $this->config->string(
            'platform.media_pdf_quality',
            (string) config('diyar_media.optimization.pdf.ghostscript_quality', '/ebook'),
        );

        return in_array($preset, ['/screen', '/ebook', '/printer', '/prepress'], true)
            ? $preset
            : '/ebook';
    }

    public function canOptimizeRaster(): bool
    {
        return extension_loaded('gd') && function_exists('imagewebp');
    }

    public function canOptimizePdf(): bool
    {
        return $this->ghostscriptBinary() !== null;
    }

    /**
     * @return array{gd: bool, ghostscript: bool, raster_enabled: bool, pdf_enabled: bool, webp_quality: int, pdf_preset: string}
     */
    public function capabilities(): array
    {
        return [
            'gd' => $this->canOptimizeRaster(),
            'ghostscript' => $this->canOptimizePdf(),
            'raster_enabled' => $this->isEnabled(),
            'pdf_enabled' => $this->isPdfOptimizationEnabled(),
            'webp_quality' => $this->webpQuality(),
            'pdf_preset' => $this->pdfQualityPreset(),
        ];
    }

    /**
     * Convert JPEG/PNG/WebP uploads to compressed WebP (or re-compress WebP).
     * SVG and unknown types pass through unchanged.
     */
    public function optimizeRasterImage(UploadedFile $file, string $profile = 'default'): OptimizedMedia
    {
        $mime = (string) $file->getMimeType();

        if ($mime === 'image/svg+xml') {
            return OptimizedMedia::fromUploadedFile($file);
        }

        if (! $this->isEnabled() || ! $this->canOptimizeRaster()) {
            return OptimizedMedia::fromUploadedFile($file);
        }

        if (! in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
            return OptimizedMedia::fromUploadedFile($file);
        }

        $path = $file->getRealPath();
        if ($path === false || $path === '') {
            return OptimizedMedia::fromUploadedFile($file);
        }

        try {
            $image = $this->loadRasterImage($path, $mime);
            if ($image === null) {
                return OptimizedMedia::fromUploadedFile($file);
            }

            [$maxWidth, $maxHeight] = $this->profileDimensions($profile);
            $resized = $this->resizeWithinBounds($image, $maxWidth, $maxHeight);

            $contents = $this->encodeWebp($resized, $this->webpQuality());

            if ($resized !== $image) {
                imagedestroy($resized);
            }
            imagedestroy($image);

            if ($contents === '') {
                return OptimizedMedia::fromUploadedFile($file);
            }

            $originalSize = (int) $file->getSize();
            if ($originalSize > 0 && strlen($contents) >= $originalSize) {
                return OptimizedMedia::fromUploadedFile($file);
            }

            return new OptimizedMedia(
                contents: $contents,
                mimeType: 'image/webp',
                extension: 'webp',
                sizeBytes: strlen($contents),
            );
        } catch (Throwable $exception) {
            Log::warning('diyar.media.raster_optimization_failed', [
                'mime' => $mime,
                'profile' => $profile,
                'message' => $exception->getMessage(),
            ]);

            return OptimizedMedia::fromUploadedFile($file);
        }
    }

    /**
     * Losslessly-ish PDF shrink via Ghostscript when available.
     */
    public function optimizePdf(UploadedFile $file): OptimizedMedia
    {
        $mime = (string) $file->getMimeType();
        if ($mime !== 'application/pdf') {
            return OptimizedMedia::fromUploadedFile($file);
        }

        if (! $this->isPdfOptimizationEnabled() || ! $this->canOptimizePdf()) {
            return OptimizedMedia::fromUploadedFile($file);
        }

        $inputPath = $file->getRealPath();
        if ($inputPath === false || $inputPath === '') {
            return OptimizedMedia::fromUploadedFile($file);
        }

        $outputPath = tempnam(sys_get_temp_dir(), 'diyar-pdf-');
        if ($outputPath === false) {
            return OptimizedMedia::fromUploadedFile($file);
        }

        $pdfOutput = $outputPath.'.pdf';

        try {
            $process = new Process([
                $this->ghostscriptBinary(),
                '-sDEVICE=pdfwrite',
                '-dCompatibilityLevel=1.4',
                '-dPDFSETTINGS='.$this->pdfQualityPreset(),
                '-dNOPAUSE',
                '-dQUIET',
                '-dBATCH',
                '-sOutputFile='.$pdfOutput,
                $inputPath,
            ]);
            $process->setTimeout(120);
            $process->run();

            if (! $process->isSuccessful() || ! is_file($pdfOutput)) {
                return OptimizedMedia::fromUploadedFile($file);
            }

            $optimizedContents = (string) file_get_contents($pdfOutput);
            $originalContents = (string) file_get_contents($inputPath);

            if ($optimizedContents === '' || strlen($optimizedContents) >= strlen($originalContents)) {
                return OptimizedMedia::fromUploadedFile($file);
            }

            return new OptimizedMedia(
                contents: $optimizedContents,
                mimeType: 'application/pdf',
                extension: 'pdf',
                sizeBytes: strlen($optimizedContents),
            );
        } catch (Throwable $exception) {
            Log::warning('diyar.media.pdf_optimization_failed', [
                'message' => $exception->getMessage(),
            ]);

            return OptimizedMedia::fromUploadedFile($file);
        } finally {
            @unlink($outputPath);
            @unlink($pdfOutput);
        }
    }

    /**
     * @return array{0: int, 1: int}
     */
    private function profileDimensions(string $profile): array
    {
        /** @var array<string, array{max_width?: int, max_height?: int}> $profiles */
        $profiles = config('diyar_media.optimization.profiles', []);
        $settings = $profiles[$profile] ?? $profiles['default'] ?? [];

        return [
            (int) ($settings['max_width'] ?? 2400),
            (int) ($settings['max_height'] ?? 2400),
        ];
    }

    private function loadRasterImage(string $path, string $mime): ?GdImage
    {
        $image = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($path),
            'image/png' => @imagecreatefrompng($path),
            'image/webp' => @imagecreatefromwebp($path),
            default => false,
        };

        return $image instanceof GdImage ? $image : null;
    }

    private function resizeWithinBounds(GdImage $image, int $maxWidth, int $maxHeight): GdImage
    {
        $width = imagesx($image);
        $height = imagesy($image);

        if ($width <= 0 || $height <= 0) {
            return $this->copyImage($image);
        }

        if ($width <= $maxWidth && $height <= $maxHeight) {
            return $this->copyImage($image);
        }

        $scale = min($maxWidth / $width, $maxHeight / $height);
        $targetWidth = max(1, (int) round($width * $scale));
        $targetHeight = max(1, (int) round($height * $scale));

        $canvas = imagecreatetruecolor($targetWidth, $targetHeight);
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
        imagefilledrectangle($canvas, 0, 0, $targetWidth, $targetHeight, $transparent);

        imagecopyresampled(
            $canvas,
            $image,
            0,
            0,
            0,
            0,
            $targetWidth,
            $targetHeight,
            $width,
            $height,
        );

        return $canvas;
    }

    private function copyImage(GdImage $image): GdImage
    {
        $width = imagesx($image);
        $height = imagesy($image);
        $copy = imagecreatetruecolor($width, $height);
        imagealphablending($copy, false);
        imagesavealpha($copy, true);
        imagecopy($copy, $image, 0, 0, 0, 0, $width, $height);

        return $copy;
    }

    private function encodeWebp(GdImage $image, int $quality): string
    {
        ob_start();
        imagewebp($image, null, max(1, min(100, $quality)));

        return (string) ob_get_clean();
    }

    private function ghostscriptBinary(): ?string
    {
        if ($this->ghostscriptResolved) {
            return $this->ghostscriptBinary;
        }

        $this->ghostscriptResolved = true;

        foreach (['gs', 'gswin64c', 'gswin32c'] as $candidate) {
            $process = new Process([$candidate, '--version']);
            $process->run();
            if ($process->isSuccessful()) {
                $this->ghostscriptBinary = $candidate;

                return $candidate;
            }
        }

        return null;
    }
}
