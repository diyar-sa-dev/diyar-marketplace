<?php

declare(strict_types=1);

/**
 * Replaces cert/visual-search PNGs with gradient patterns (fixes solid-color dHash collision).
 */

use App\Jobs\Search\IndexProductImageJob;
use App\Models\ProductImage;
use Illuminate\Support\Facades\Storage;

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$disk = (string) config('diyar_media.disk', 'media');
$images = ProductImage::query()
    ->whereHas('mediaFile', fn ($q) => $q->where('path', 'like', 'cert/visual-search/%'))
    ->with('mediaFile')
    ->orderBy('id')
    ->get();

$updated = 0;
foreach ($images as $index => $productImage) {
    $media = $productImage->mediaFile;
    if ($media === null) {
        continue;
    }

    $w = 400 + ($index * 40);
    $h = 400;
    $img = imagecreatetruecolor($w, $h);
    for ($y = 0; $y < $h; $y++) {
        for ($x = 0; $x < $w; $x++) {
            $r = (int) (($x * 7 + $index * 41) % 256);
            $g = (int) (($y * 11 + $index * 23) % 256);
            $b = (int) ((($x + $y) * 5 + $index * 17) % 256);
            imagesetpixel($img, $x, $y, imagecolorallocate($img, $r, $g, $b));
        }
    }
    imagefilledrectangle($img, 10, 10, 60 + ($index * 15), 60 + ($index * 10), imagecolorallocate($img, 255 - ($index * 40), $index * 50, 128));
    ob_start();
    imagepng($img);
    $bytes = ob_get_clean();
    imagedestroy($img);

    Storage::disk($disk)->put($media->path, $bytes);
    $media->update(['size_bytes' => strlen($bytes)]);
    IndexProductImageJob::dispatchSync($productImage->id);
    $updated++;
}

echo json_encode(['refreshed' => $updated], JSON_PRETTY_PRINT).PHP_EOL;
