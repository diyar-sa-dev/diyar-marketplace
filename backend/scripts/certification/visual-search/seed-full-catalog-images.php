<?php

declare(strict_types=1);

/**
 * Seeds distinct gradient images for all publicly visible products missing images.
 * Scoped to cert/visual-search paths — for certification/local only.
 */

use App\Jobs\Search\IndexProductImageJob;
use App\Models\MediaFile;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$disk = (string) config('diyar_media.disk', 'media');
$user = User::query()->first();
$products = Product::query()->publiclyVisible()->get();
$created = 0;
$index = ProductImage::query()->count();

foreach ($products as $product) {
    if ($product->images()->exists()) {
        continue;
    }

    $seed = $index++;
    $w = 380 + ($seed * 25);
    $h = 360 + ($seed * 15);
    $img = imagecreatetruecolor($w, $h);
    for ($y = 0; $y < $h; $y++) {
        for ($x = 0; $x < $w; $x++) {
            $r = ($x * 7 + $seed * 41) % 256;
            $g = ($y * 11 + $seed * 23) % 256;
            $b = (($x + $y) * 5 + $seed * 17) % 256;
            imagesetpixel($img, $x, $y, imagecolorallocate($img, $r, $g, $b));
        }
    }
    imagefilledrectangle(
        $img, 20, 20, min($w - 1, 80 + ($seed * 10)), min($h - 1, 70 + ($seed * 8)),
        imagecolorallocate($img, (255 - ($seed * 20)) % 256, ($seed * 40) % 256, 160),
    );
    ob_start();
    imagepng($img);
    $bytes = ob_get_clean();
    imagedestroy($img);

    $path = 'cert/visual-search/catalog-'.Str::slug($product->id).'.png';
    Storage::disk($disk)->put($path, $bytes);

    $media = MediaFile::query()->create([
        'disk' => $disk,
        'path' => $path,
        'mime_type' => 'image/png',
        'size_bytes' => strlen($bytes),
        'uploaded_by' => $user?->id,
    ]);

    $pi = ProductImage::query()->create([
        'product_id' => $product->id,
        'media_file_id' => $media->id,
        'sort_order' => 1,
    ]);

    IndexProductImageJob::dispatchSync($pi->id);
    $created++;
}

echo json_encode(['products_seeded' => $created, 'total_product_images' => ProductImage::query()->count()], JSON_PRETTY_PRINT).PHP_EOL;
