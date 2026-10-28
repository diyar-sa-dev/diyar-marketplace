<?php

namespace Tests\Unit\Services\Media;

use App\Core\Support\Media\MediaOptimizationService;
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

        // 100x100 PNG sample with sufficient byte weight to ensure WebP compression yields lower byte count
        $png = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAB9ElEQVR4nO3Qa2sNAACA4dOSliQtaS0tSVqSJK21JEmSJGktLWnpJC1JS1paa0lLkiStpZmZ2WabmZltZmabbba5bNiwYe6GMZdh2IW/sPf7+/yEJxD4Fwxo8kIm/CKmjPtFTB3ziwgd9YuY9tcvYvofv4gZv/0iZo74RYT98ouY9dMvYvYPv4jwYb+IiO9+EXO++UVEfvWLmPvFL2LekF/E/M9+EQs++UVEDfpFLPzoF7Hog1/E4vd+EUsG/CKWvvOLWPbWLyL6jV9EzGu/iNhXfhHLX/pFrHjhF7HyuV/Eqn6/iNXP/CLWPPWLWPvEL2Jdn1/E+l6/iA2P/SI2PvKL2PTQLyKuxy8ivtsvYvMDv4iE+34RW+75RWzt8otI7PSL2HbXLyJ4xy9i+22/iB23/CKSOvwidrb7Rexq84vYfdMvIrnVL2JPi1/E3ma/iJQbfhH7mvwiUhv9ItIa/CLSr/tF7K/3izhwzS8io84v4uBVv4hDtX4Rh6/4RRyp8Ys4Wu0XcazKL+L4Zb+IzEq/iKxLfhEnKvwisi/6ReSU+0XkXvCLyCvzi8g/7xdRUOoXUVTiF1Fc7BdRes4voqzIL6K80C+iosAvovKsX0RVvl9EzRm/iNo8v4i6034R9bl+EQ2n/CKacvwimk/6RbRmB/8DHBueA2+bBFQAAAAASUVORK5CYII=',
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
