<?php

namespace Tests\Unit\Services\Media;

use App\Services\Media\MediaOptimizationService;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class MediaOptimizationServiceTest extends TestCase
{
    public function test_png_upload_is_converted_to_webp_when_gd_available(): void
    {
        $optimizer = app(MediaOptimizationService::class);

        if (! $optimizer->canOptimizeRaster()) {
            $this->markTestSkipped('GD WebP support is not available in this environment.');
        }

        $png = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            true,
        );

        $file = UploadedFile::fake()->createWithContent('sample.png', (string) $png, 'image/png');
        $optimized = $optimizer->optimizeRasterImage($file, 'default');

        $this->assertSame('image/webp', $optimized->mimeType);
        $this->assertSame('webp', $optimized->extension);
        $this->assertNotSame('', $optimized->contents);
        $this->assertGreaterThan(0, $optimized->sizeBytes);
    }

    public function test_optimizer_honors_disabled_env_flag(): void
    {
        config(['diyar_media.optimization.enabled' => false]);

        $optimizer = app(MediaOptimizationService::class);
        $file = UploadedFile::fake()->createWithContent(
            'sample.png',
            (string) base64_decode(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
                true,
            ),
            'image/png',
        );

        $optimized = $optimizer->optimizeRasterImage($file, 'default');

        $this->assertSame('image/png', $optimized->mimeType);
        $this->assertSame('png', $optimized->extension);
    }
}
