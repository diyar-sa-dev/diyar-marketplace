<?php

declare(strict_types=1);

/**
 * Phase 5 only — seeds readable product images for certification when catalog is empty.
 * NOT for production deployment.
 */

use App\Models\MediaFile;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use App\Models\VendorAccount;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

if (ProductImage::query()->count() > 0) {
    echo "Catalog already has product images; skipping seed.\n";
    exit(0);
}

$disk = (string) config('diyar_media.disk', 'media');
Storage::disk($disk)->makeDirectory('cert/visual-search');

$products = Product::query()->publiclyVisible()->limit(5)->get();
if ($products->isEmpty()) {
    $products = Product::factory()->count(5)->create();
}

$user = User::query()->first();
$created = [];

foreach ($products as $index => $product) {
    $path = "cert/visual-search/product-{$product->id}.png";
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
    // Unique marker block per product so dHash differs even under compression.
    imagefilledrectangle($img, 10, 10, 60 + ($index * 15), 60 + ($index * 10), imagecolorallocate($img, 255 - ($index * 40), $index * 50, 128));
    ob_start();
    imagepng($img);
    $bytes = ob_get_clean();
    imagedestroy($img);
    Storage::disk($disk)->put($path, $bytes);

    $media = MediaFile::query()->create([
        'disk' => $disk,
        'path' => $path,
        'mime_type' => 'image/png',
        'size_bytes' => strlen($bytes),
        'uploaded_by' => $user?->id,
    ]);

    $productImage = ProductImage::query()->create([
        'product_id' => $product->id,
        'media_file_id' => $media->id,
        'sort_order' => 1,
    ]);

    $created[] = [
        'product_id' => $product->id,
        'product_image_id' => $productImage->id,
        'media_file_id' => $media->id,
    ];
}

echo json_encode(['seeded' => count($created), 'rows' => $created], JSON_PRETTY_PRINT).PHP_EOL;
