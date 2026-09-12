<?php

declare(strict_types=1);

/**
 * Phase A — complete catalog forensic audit for merchant media recovery.
 */

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$runId = $argv[1] ?? gmdate('Y-m-d_His');
$baseDir = storage_path("certification/visual-search/enterprise/{$runId}");
foreach (['01-catalog-audit', '02-media-recovery'] as $s) {
    if (! is_dir("{$baseDir}/{$s}")) {
        mkdir("{$baseDir}/{$s}", 0777, true);
    }
}

function wjson(string $path, mixed $data): void
{
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
}

$disk = (string) config('diyar_media.disk', 'media');

$products = DB::table('products')
    ->select('id', 'status', 'deleted_at', 'vendor_account_id', 'created_at')
    ->orderBy('created_at')
    ->get();

$productImages = DB::table('product_images as pi')
    ->leftJoin('media_files as mf', 'mf.id', '=', 'pi.media_file_id')
    ->leftJoin('products as p', 'p.id', '=', 'pi.product_id')
    ->select(
        'pi.id as product_image_id',
        'pi.product_id',
        'pi.media_file_id',
        'pi.sort_order',
        'mf.path',
        'mf.mime_type',
        'mf.size_bytes',
        'p.status as product_status',
        'p.deleted_at as product_deleted'
    )
    ->get();

$visualIndex = DB::table('visual_index_entries')
    ->select('id', 'product_id', 'product_image_id', 'media_file_id', 'is_active', 'hash_bucket')
    ->get();

$orphanFiles = [];
$productDirs = Storage::disk($disk)->allDirectories('products');
foreach ($productDirs as $dir) {
    $productId = basename($dir);
    $files = Storage::disk($disk)->files($dir);
    if ($files === []) {
        continue;
    }
    $productExists = DB::table('products')->where('id', $productId)->exists();
    $mediaByPath = DB::table('media_files')->where('path', 'like', $dir.'/%')->get()->keyBy('path');
    $piByMedia = DB::table('product_images')
        ->whereIn('media_file_id', $mediaByPath->pluck('id'))
        ->get()
        ->keyBy('media_file_id');

    foreach ($files as $path) {
        $mf = $mediaByPath->get($path);
        $mtime = Storage::disk($disk)->lastModified($path);
        $size = Storage::disk($disk)->size($path);
        $ext = pathinfo($path, PATHINFO_EXTENSION);
        $classification = 'UNKNOWN';
        if ($mf !== null && $piByMedia->has($mf->id)) {
            $classification = 'ALREADY_LINKED';
        } elseif ($mf !== null) {
            $classification = 'RECOVERABLE';
        } elseif ($productExists) {
            $classification = 'RECOVERABLE';
        } elseif (! $productExists) {
            $classification = 'UNRECOVERABLE';
        }

        $orphanFiles[] = [
            'filesystem_path' => $path,
            'filename' => basename($path),
            'extension' => $ext,
            'size_bytes' => $size,
            'mtime' => gmdate('c', $mtime),
            'product_uuid_from_path' => $productId,
            'product_exists' => $productExists,
            'media_file_id' => $mf?->id,
            'product_image_id' => $mf ? ($piByMedia->get($mf->id)?->id) : null,
            'classification' => $classification,
        ];
    }
}

$certImages = $productImages->filter(fn ($r) => str_starts_with((string) $r->path, 'cert/'));
$merchantImages = $productImages->filter(fn ($r) => str_starts_with((string) $r->path, 'products/'));

wjson("{$baseDir}/01-catalog-audit/catalog-audit.json", [
    'generated_at' => gmdate('c'),
    'products' => [
        'total' => $products->count(),
        'active_not_deleted' => $products->whereNull('deleted_at')->count(),
        'deleted' => $products->whereNotNull('deleted_at')->count(),
    ],
    'product_images' => [
        'total' => $productImages->count(),
        'cert_paths' => $certImages->count(),
        'merchant_paths' => $merchantImages->count(),
        'rows' => $productImages->map(fn ($r) => (array) $r)->values()->all(),
    ],
    'media_files' => [
        'products_path' => DB::table('media_files')->where('path', 'like', 'products/%')->count(),
        'cert_path' => DB::table('media_files')->where('path', 'like', 'cert/%')->count(),
    ],
    'visual_index_entries' => [
        'active' => $visualIndex->where('is_active', 1)->count(),
        'total' => $visualIndex->count(),
    ],
    'orphan_files' => $orphanFiles,
    'orphan_summary' => [
        'total_files' => count($orphanFiles),
        'recoverable' => count(array_filter($orphanFiles, fn ($f) => $f['classification'] === 'RECOVERABLE')),
        'unrecoverable' => count(array_filter($orphanFiles, fn ($f) => $f['classification'] === 'UNRECOVERABLE')),
        'already_linked' => count(array_filter($orphanFiles, fn ($f) => $f['classification'] === 'ALREADY_LINKED')),
    ],
    'active_product_ids' => $products->whereNull('deleted_at')->pluck('id')->values()->all(),
]);

echo json_encode(['run_id' => $runId, 'orphan_summary' => json_decode(file_get_contents("{$baseDir}/01-catalog-audit/catalog-audit.json"), true)['orphan_summary']], JSON_PRETTY_PRINT).PHP_EOL;
