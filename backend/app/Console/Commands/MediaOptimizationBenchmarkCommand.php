<?php

namespace App\Console\Commands;

use App\Services\Media\MediaOptimizationService;
use App\Services\Settings\EffectiveConfigService;
use App\Support\Media\OptimizedMedia;
use Illuminate\Console\Command;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;

final class MediaOptimizationBenchmarkCommand extends Command
{
    protected $signature = 'diyar:media-optimization-benchmark
                            {--quality=82 : WebP quality to test}
                            {--iterations=1 : Repeat count for timing average}';

    protected $description = 'Compare upload sizes before vs after DIYAR media optimization (WebP + optional PDF).';

    public function handle(MediaOptimizationService $optimizer, EffectiveConfigService $config): int
    {
        $this->info('DIYAR media optimization benchmark');
        $this->newLine();

        $capabilities = $optimizer->capabilities();
        $this->table(
            ['Capability', 'Status'],
            [
                ['GD + WebP', $capabilities['gd'] ? 'yes' : 'no'],
                ['Ghostscript', $capabilities['ghostscript'] ? 'yes' : 'no'],
                ['Raster optimization enabled', $capabilities['raster_enabled'] ? 'yes' : 'no'],
                ['PDF optimization enabled', $capabilities['pdf_enabled'] ? 'yes' : 'no'],
                ['WebP quality', (string) $capabilities['webp_quality']],
                ['PDF preset', $capabilities['pdf_preset']],
            ],
        );

        $this->newLine();
        $this->line('Raster samples (PNG → stored format):');

        $png = $this->samplePng();
        $jpeg = $this->sampleJpeg();
        $samples = [
            ['label' => '1×1 PNG', 'file' => UploadedFile::fake()->createWithContent('tiny.png', $png, 'image/png')],
            ['label' => '640×480 JPEG', 'file' => UploadedFile::fake()->createWithContent('photo.jpg', $jpeg, 'image/jpeg')],
        ];

        $iterations = max(1, (int) $this->option('iterations'));
        $rows = [];

        foreach ($samples as $sample) {
            /** @var UploadedFile $file */
            $file = $sample['file'];
            $before = OptimizedMedia::fromUploadedFile($file);

            Config::set('diyar_media.optimization.enabled', false);
            $config->invalidate('platform.media_optimize_enabled');
            $disabled = $optimizer->optimizeRasterImage($file, 'product');

            Config::set('diyar_media.optimization.enabled', true);
            Config::set('diyar_media.optimization.webp_quality', (int) $this->option('quality'));
            $config->invalidate('platform.media_optimize_enabled');
            $config->invalidate('platform.media_webp_quality');

            $start = hrtime(true);
            for ($i = 0; $i < $iterations; $i++) {
                $after = $optimizer->optimizeRasterImage($file, 'product');
            }
            $elapsedMs = (hrtime(true) - $start) / 1_000_000 / $iterations;

            $saved = $before->sizeBytes > 0
                ? round((1 - ($after->sizeBytes / $before->sizeBytes)) * 100, 1)
                : 0.0;

            $rows[] = [
                $sample['label'],
                $before->mimeType,
                $this->formatBytes($before->sizeBytes),
                $after->mimeType,
                $this->formatBytes($after->sizeBytes),
                $saved >= 0 ? "{$saved}%" : 'n/a',
                number_format($elapsedMs, 2).' ms',
            ];
        }

        $this->table(
            ['Sample', 'Before MIME', 'Before size', 'After MIME', 'After size', 'Saved', 'Avg time'],
            $rows,
        );

        $this->newLine();
        $this->comment('Tip: toggle platform.media_optimize_enabled in Admin → Settings → Platform & support.');

        return self::SUCCESS;
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes.' B';
        }

        return round($bytes / 1024, 1).' KB';
    }

    private function samplePng(): string
    {
        $decoded = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            true,
        );

        return is_string($decoded) ? $decoded : '';
    }

    private function sampleJpeg(): string
    {
        if (! extension_loaded('gd')) {
            return '';
        }

        $image = imagecreatetruecolor(640, 480);
        if ($image === false) {
            return '';
        }

        $bg = imagecolorallocate($image, 148, 121, 97);
        imagefilledrectangle($image, 0, 0, 640, 480, $bg);

        ob_start();
        imagejpeg($image, null, 90);
        imagedestroy($image);

        return (string) ob_get_clean();
    }
}
