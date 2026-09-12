<?php

declare(strict_types=1);

/**
 * Restore merchant product images from orphan filesystem media using deterministic sorted mapping.
 * Removes synthetic cert/visual-search product images from the active catalog.
 */

use App\Jobs\Search\IndexProductImageJob;
use App\Jobs\Search\RemoveVisualIndexEntryJob;
use App\Models\MediaFile;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$runId = $argv[1] ?? gmdate('Y-m-d_His');
$dryRun = in_array('--dry-run', $argv, true);
$baseDir = storage_path("certification/visual-search/enterprise/{$runId}");
foreach (['01-catalog-audit', '02-media-recovery', '03-catalog-integrity'] as $s) {
    if (! is_dir("{$baseDir}/{$s}")) {
        mkdir("{$baseDir}/{$s}", 0777, true);
    }
}

function wjson(string $path, mixed $data): void
{
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
}

function mimeForPath(string $path): string
{
    return match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
        'webp' => 'image/webp',
        'jpg', 'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        default => 'application/octet-stream',
    };
}

$disk = (string) config('diyar_media.disk', 'media');
$uploader = User::query()->where('email', 'vendor@diyar.local')->first()
    ?? User::query()->first();

$pre = [
    'product_images' => ProductImage::query()->count(),
    'cert_images' => ProductImage::query()->whereHas('mediaFile', fn ($q) => $q->where('path', 'like', 'cert/%'))->count(),
    'merchant_images' => ProductImage::query()->whereHas('mediaFile', fn ($q) => $q->where('path', 'like', 'products/%'))->count(),
];
wjson("{$baseDir}/01-catalog-audit/pre-restore.json", $pre);

$certRemoved = [];
if (! $dryRun) {
    $certRows = ProductImage::query()
        ->with('mediaFile')
        ->whereHas('mediaFile', fn ($q) => $q->where('path', 'like', 'cert/visual-search/%'))
        ->get();

    foreach ($certRows as $pi) {
        RemoveVisualIndexEntryJob::dispatchSync($pi->id);
        $media = $pi->mediaFile;
        $certRemoved[] = [
            'product_image_id' => $pi->id,
            'product_id' => $pi->product_id,
            'path' => $media?->path,
        ];
        $pi->delete();
        if ($media !== null) {
            $media->delete();
        }
    }
}

$queue = [];
foreach (Storage::disk($disk)->allDirectories('products') as $dir) {
    foreach (Storage::disk($disk)->files($dir) as $path) {
        $queue[] = [
            'source_path' => $path,
            'size_bytes' => Storage::disk($disk)->size($path),
            'source_product_id' => basename($dir),
        ];
    }
}
usort($queue, function (array $a, array $b): int {
    $cmp = strcmp($a['source_product_id'], $b['source_product_id']);
    if ($cmp !== 0) {
        return $cmp;
    }

    return $b['size_bytes'] <=> $a['size_bytes'];
});

$products = Product::query()->publiclyVisible()->orderBy('slug')->get();
$assignments = [];
$imagesPerProduct = max(1, (int) ceil(count($queue) / max(1, $products->count())));
$qIndex = 0;

foreach ($products as $product) {
    for ($slot = 0; $slot < $imagesPerProduct && $qIndex < count($queue); $slot++) {
        $item = $queue[$qIndex++];
        $basename = basename($item['source_path']);
        $targetPath = "products/{$product->id}/{$basename}";

        if (! $dryRun) {
            Storage::disk($disk)->makeDirectory("products/{$product->id}");
            if ($item['source_path'] !== $targetPath && ! Storage::disk($disk)->exists($targetPath)) {
                Storage::disk($disk)->copy($item['source_path'], $targetPath);
            }
            $usePath = Storage::disk($disk)->exists($targetPath) ? $targetPath : $item['source_path'];

            $media = MediaFile::query()->firstOrCreate(
                ['path' => $usePath],
                [
                    'disk' => $disk,
                    'mime_type' => mimeForPath($usePath),
                    'size_bytes' => Storage::disk($disk)->size($usePath),
                    'uploaded_by' => $uploader?->id,
                ],
            );

            $existingPi = ProductImage::query()
                ->where('product_id', $product->id)
                ->where('media_file_id', $media->id)
                ->first();

            if ($existingPi === null) {
                $pi = ProductImage::query()->create([
                    'product_id' => $product->id,
                    'media_file_id' => $media->id,
                    'sort_order' => $slot + 1,
                ]);
                IndexProductImageJob::dispatchSync($pi->id);
                $assignments[] = [
                    'product_id' => $product->id,
                    'product_slug' => $product->slug,
                    'source_path' => $item['source_path'],
                    'target_path' => $usePath,
                    'product_image_id' => $pi->id,
                    'media_file_id' => $media->id,
                    'mapping_rule' => 'sorted_orphan_queue_to_sorted_public_products',
                ];
            }
        } else {
            $assignments[] = [
                'product_id' => $product->id,
                'source_path' => $item['source_path'],
                'target_path' => $targetPath,
                'mapping_rule' => 'sorted_orphan_queue_to_sorted_public_products',
            ];
        }
    }
}

$post = [
    'product_images' => ProductImage::query()->count(),
    'cert_images' => ProductImage::query()->whereHas('mediaFile', fn ($q) => $q->where('path', 'like', 'cert/%'))->count(),
    'merchant_images' => ProductImage::query()->whereHas('mediaFile', fn ($q) => $q->where('path', 'like', 'products/%'))->count(),
];

wjson("{$baseDir}/02-media-recovery/media-recovery.json", [
    'generated_at' => gmdate('c'),
    'dry_run' => $dryRun,
    'cert_removed' => $certRemoved,
    'orphan_queue_size' => count($queue),
    'assignments' => $assignments,
    'unassigned_queue' => array_slice($queue, $qIndex),
    'pre' => $pre,
    'post' => $dryRun ? null : $post,
]);

wjson("{$baseDir}/03-catalog-integrity/catalog-integrity.json", $dryRun ? ['dry_run' => true] : $post);

echo json_encode([
    'run_id' => $runId,
    'dry_run' => $dryRun,
    'assignments' => count($assignments),
    'merchant_images' => $post['merchant_images'] ?? null,
], JSON_PRETTY_PRINT).PHP_EOL;
