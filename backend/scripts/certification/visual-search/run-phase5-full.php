<?php

declare(strict_types=1);

/**
 * Phase 5 full certification runner — sections 2–8 evidence collection.
 *
 * Usage (Docker app container):
 *   php backend/scripts/certification/visual-search/run-phase5-full.php [--base-dir=/path]
 */

use App\Jobs\Search\IndexProductImageJob;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\VisualIndexEntry;
use App\Models\VisualSearchEvent;
use App\Support\VisualSearch\BucketProbe;
use App\Support\VisualSearch\Dhash64Generator;
use App\Support\VisualSearch\VisualHashBits;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$baseArg = null;
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--base-dir=')) {
        $baseArg = substr($arg, strlen('--base-dir='));
    }
}

$timestamp = gmdate('Y-m-d_His');
$baseDir = $baseArg ?: storage_path("certification/visual-search/phase5/{$timestamp}");
foreach (['01-migration', '02-indexing', '03-accuracy', '04-performance', '05-security', '06-queue', '07-frontend-e2e', '08-docker-integration'] as $section) {
    if (! is_dir("{$baseDir}/{$section}")) {
        mkdir("{$baseDir}/{$section}", 0777, true);
    }
}

function writeJson(string $path, mixed $data): void
{
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
}

function writeText(string $path, string $content): void
{
    file_put_contents($path, $content);
}

function makePng(int $w, int $h, int $r = 80, int $g = 120, int $b = 160): string
{
    $img = imagecreatetruecolor($w, $h);
    $color = imagecolorallocate($img, $r, $g, $b);
    imagefill($img, 0, 0, $color);
    ob_start();
    imagepng($img);
    $bytes = ob_get_clean();
    imagedestroy($img);

    return (string) $bytes;
}

function tempUpload(string $bytes, string $name, string $mime): UploadedFile
{
    $path = tempnam(sys_get_temp_dir(), 'diyar-vs-');
    file_put_contents($path, $bytes);

    return new UploadedFile($path, $name, $mime, null, true);
}

$indexVersion = (string) config('diyar.visual_search.index_version', 'catalog-v1');
$apiBase = rtrim((string) env('APP_URL', 'http://nginx'), '/');

// §2 Indexing — set equality proof
$eligibleIds = DB::table('product_images as pi')
    ->join('products as p', 'p.id', '=', 'pi.product_id')
    ->join('vendor_accounts as va', 'va.id', '=', 'p.vendor_account_id')
    ->join('media_files as mf', 'mf.id', '=', 'pi.media_file_id')
    ->whereNull('p.deleted_at')
    ->where('p.status', 'active')
    ->where('va.status', 'active')
    ->pluck('pi.id')
    ->map(fn ($id) => (string) $id)
    ->sort()
    ->values()
    ->all();

$indexedIds = VisualIndexEntry::query()
    ->where('is_active', true)
    ->where('index_version', $indexVersion)
    ->pluck('product_image_id')
    ->map(fn ($id) => (string) $id)
    ->sort()
    ->values()
    ->all();

$activeIndex = count($indexedIds);
$distinctProductImage = VisualIndexEntry::query()
    ->where('is_active', true)
    ->where('index_version', $indexVersion)
    ->distinct('product_image_id')
    ->count('product_image_id');
$distinctMedia = VisualIndexEntry::query()
    ->where('is_active', true)
    ->where('index_version', $indexVersion)
    ->distinct('media_file_id')
    ->count('media_file_id');

$beforeIdempotency = $activeIndex;
$beforeUpdatedAt = VisualIndexEntry::query()->where('is_active', true)->max('updated_at');

// Idempotent reindex — dispatch and sync process
$images = ProductImage::query()->pluck('id');
foreach ($images as $imageId) {
    IndexProductImageJob::dispatchSync($imageId);
}

$afterIdempotency = VisualIndexEntry::query()
    ->where('is_active', true)
    ->where('index_version', $indexVersion)
    ->count();

$indexing = [
    'index_version' => $indexVersion,
    'eligible_images' => count($eligibleIds),
    'active_index_rows' => $activeIndex,
    'distinct_product_image_id' => $distinctProductImage,
    'distinct_media_file_id' => $distinctMedia,
    'unique_constraints_ok' => $distinctProductImage === $activeIndex && $distinctMedia === $activeIndex,
    'eligible_image_ids' => $eligibleIds,
    'indexed_image_ids' => $indexedIds,
    'set_difference_missing_from_index' => array_values(array_diff($eligibleIds, $indexedIds)),
    'set_difference_extra_in_index' => array_values(array_diff($indexedIds, $eligibleIds)),
    'set_difference_zero' => $eligibleIds === $indexedIds,
    'intentionally_skipped' => [],
];
writeJson("{$baseDir}/02-indexing/counts.json", $indexing);
writeJson("{$baseDir}/02-indexing/idempotency.json", [
    'before_count' => $beforeIdempotency,
    'after_sync_reindex_count' => $afterIdempotency,
    'before_max_updated_at' => $beforeUpdatedAt,
    'after_max_updated_at' => VisualIndexEntry::query()->where('is_active', true)->max('updated_at'),
    'no_duplicate_rows' => $afterIdempotency === $beforeIdempotency,
]);

$sampleRows = VisualIndexEntry::query()
    ->where('is_active', true)
    ->inRandomOrder()
    ->limit(5)
    ->get(['id', 'product_id', 'product_image_id', 'media_file_id', 'hash_bucket', 'index_version', 'is_active', 'indexed_at'])
    ->map(fn ($row) => $row->toArray())
    ->all();
writeJson("{$baseDir}/02-indexing/sample-rows.json", $sampleRows);

// §3 Accuracy — real catalog images
$accuracyRows = [];
$thresholdHits = [];
$gen = new Dhash64Generator((int) config('diyar.visual_search.working_dimension_px', 256));
$maxHamming = (int) config('diyar.visual_search.max_hamming_distance', 19);

$entries = VisualIndexEntry::query()
    ->where('is_active', true)
    ->with(['productImage.mediaFile'])
    ->get();

foreach ($entries as $idx => $entry) {
    $media = $entry->productImage?->mediaFile;
    if ($media === null) {
        continue;
    }

    $disk = Storage::disk($media->disk);
    if (! $disk->exists($media->path)) {
        continue;
    }

    $tempPath = tempnam(sys_get_temp_dir(), 'diyar-acc-');
    file_put_contents($tempPath, $disk->get($media->path));

    try {
        $response = Http::attach('image', file_get_contents($tempPath), 'query.png', ['Content-Type' => 'image/png'])
            ->acceptJson()
            ->post("{$apiBase}/api/v1/search/visual");

        $body = $response->json();
        $top1 = $body['data']['items'][0] ?? null;
        $similarity = isset($top1['similarity']) ? (float) $top1['similarity'] : null;
        $top1Id = $top1['id'] ?? null;
        $expected = 'match';
        $correct = $top1Id === $entry->product_id && ($similarity ?? 0) >= 0.70;

        $queryHash = $gen->fromFilePath($tempPath);
        $storedHash = (string) $entry->getRawOriginal('hash_bits');
        $distance = VisualHashBits::hammingDistance($queryHash, $storedHash);

        $thresholdHits[] = [
            'query_id' => "same-image-{$idx}",
            'hamming_distance' => $distance,
            'similarity' => VisualHashBits::similarity($queryHash, $storedHash),
            'passes_threshold' => $distance <= $maxHamming,
        ];

        $accuracyRows[] = [
            'query_id' => "same-image-{$idx}",
            'case_type' => 'same_product_same_image',
            'expected' => $expected,
            'top1_id' => $top1Id,
            'expected_product_id' => $entry->product_id,
            'similarity' => $similarity,
            'correct' => $correct,
            'http_status' => $response->status(),
        ];
    } finally {
        @unlink($tempPath);
    }
}

// Resized/recompressed variant
if ($entries->isNotEmpty()) {
    $entry = $entries->first();
    $media = $entry->productImage?->mediaFile;
    if ($media !== null && Storage::disk($media->disk)->exists($media->path)) {
        $source = Storage::disk($media->disk)->get($media->path);
        $img = imagecreatefromstring($source);
        if ($img !== false) {
            $resized = imagecreatetruecolor(128, 128);
            imagecopyresampled($resized, $img, 0, 0, 0, 0, 128, 128, imagesx($img), imagesy($img));
            ob_start();
            imagejpeg($resized, null, 75);
            $jpegBytes = ob_get_clean();
            imagedestroy($img);
            imagedestroy($resized);

            $tempPath = tempnam(sys_get_temp_dir(), 'diyar-acc-resize-');
            file_put_contents($tempPath, $jpegBytes);
            $response = Http::attach('image', $jpegBytes, 'query.jpg', ['Content-Type' => 'image/jpeg'])
                ->acceptJson()
                ->post("{$apiBase}/api/v1/search/visual");
            $top1 = $response->json()['data']['items'][0] ?? null;
            $accuracyRows[] = [
                'query_id' => 'resized-recompressed',
                'case_type' => 'same_image_resized',
                'expected' => 'match',
                'top1_id' => $top1['id'] ?? null,
                'expected_product_id' => $entry->product_id,
                'similarity' => isset($top1['similarity']) ? (float) $top1['similarity'] : null,
                'correct' => ($top1['id'] ?? null) === $entry->product_id,
                'http_status' => $response->status(),
            ];
            @unlink($tempPath);
        }
    }
}

// Different color = no match
$differentPng = makePng(400, 400, 200, 50, 50);
$response = Http::attach('image', $differentPng, 'different.png', ['Content-Type' => 'image/png'])
    ->acceptJson()
    ->post("{$apiBase}/api/v1/search/visual");
$items = $response->json()['data']['items'] ?? [];
$accuracyRows[] = [
    'query_id' => 'different-color',
    'case_type' => 'no_reasonable_match',
    'expected' => 'no_match',
    'top1_id' => $items[0]['id'] ?? null,
    'similarity' => isset($items[0]['similarity']) ? (float) $items[0]['similarity'] : null,
    'correct' => empty($items) || (($items[0]['similarity'] ?? 0) < 0.70),
    'http_status' => $response->status(),
];

$correctCount = count(array_filter($accuracyRows, fn (array $r) => $r['correct'] === true));
writeJson("{$baseDir}/03-accuracy/evaluation-matrix.json", [
    'cases' => $accuracyRows,
    'precision_at_5' => null,
    'recall_at_5' => null,
    'correct_count' => $correctCount,
    'total_cases' => count($accuracyRows),
    'accuracy_rate' => count($accuracyRows) > 0 ? round($correctCount / count($accuracyRows), 4) : 0,
]);
writeJson("{$baseDir}/03-accuracy/threshold-analysis.json", [
    'threshold' => 0.70,
    'max_hamming' => $maxHamming,
    'same_image_distances' => $thresholdHits,
    'all_same_image_pass_threshold' => array_reduce($thresholdHits, fn ($ok, $row) => $ok && $row['passes_threshold'], true),
]);

// §4 Performance
if (Schema::hasTable('visual_index_entries')) {
    $sampleHash = VisualIndexEntry::query()->value('hash_bits');
    if (is_string($sampleHash) && strlen($sampleHash) === 8) {
        $bucket = VisualHashBits::bucketFromHashBits($sampleHash);
        $buckets = BucketProbe::probeBuckets($bucket, (int) config('diyar.visual_search.bucket_probe_radius', 3));
        $placeholders = implode(',', array_fill(0, count($buckets), '?'));
        $sql = "EXPLAIN SELECT id, product_id, product_image_id, hash_bits FROM visual_index_entries WHERE is_active = 1 AND index_version = ? AND hash_bucket IN ({$placeholders}) LIMIT 1500";
        $bindings = array_merge([$indexVersion], $buckets);
        $explain = DB::select($sql, $bindings);

        $latencies = [];
        for ($i = 0; $i < 10; $i++) {
            $start = hrtime(true);
            DB::select(
                "SELECT id, product_id, product_image_id, hash_bits FROM visual_index_entries WHERE is_active = 1 AND index_version = ? AND hash_bucket IN ({$placeholders}) LIMIT 1500",
                $bindings,
            );
            $latencies[] = (hrtime(true) - $start) / 1_000_000;
        }
        sort($latencies);

        $searchLatencies = [];
        if ($entries->isNotEmpty()) {
            $first = $entries->first();
            $media = $first->productImage?->mediaFile;
            if ($media !== null && Storage::disk($media->disk)->exists($media->path)) {
                $bytes = Storage::disk($media->disk)->get($media->path);
                for ($i = 0; $i < 10; $i++) {
                    $start = hrtime(true);
                    Http::attach('image', $bytes, 'perf.png', ['Content-Type' => 'image/png'])
                        ->withHeaders(['Cache-Control' => 'no-cache', 'X-Visual-Search-Session' => 'perf-'.$i])
                        ->acceptJson()
                        ->post("{$apiBase}/api/v1/search/visual");
                    $searchLatencies[] = (hrtime(true) - $start) / 1_000_000;
                }
                sort($searchLatencies);
            }
        }

        // Cache hit test
        $cacheResult = ['first' => null, 'second' => null];
        if ($entries->isNotEmpty()) {
            $media = $entries->first()->productImage?->mediaFile;
            if ($media !== null && Storage::disk($media->disk)->exists($media->path)) {
                $bytes = Storage::disk($media->disk)->get($media->path);
                $session = 'cache-test-'.Str::uuid();
                $r1 = Http::attach('image', $bytes, 'cache.png', ['Content-Type' => 'image/png'])
                    ->withHeaders(['X-Visual-Search-Session' => $session])
                    ->acceptJson()
                    ->post("{$apiBase}/api/v1/search/visual");
                $r2 = Http::attach('image', $bytes, 'cache.png', ['Content-Type' => 'image/png'])
                    ->withHeaders(['X-Visual-Search-Session' => $session])
                    ->acceptJson()
                    ->post("{$apiBase}/api/v1/search/visual");
                $cacheResult = [
                    'first_cache' => $r1->json('meta.cache'),
                    'second_cache' => $r2->json('meta.cache'),
                ];
            }
        }

        writeJson("{$baseDir}/04-performance/explain-and-latency.json", [
            'probe_bucket_count' => count($buckets),
            'probe_radius' => config('diyar.visual_search.bucket_probe_radius', 3),
            'sql_prefetch_cap' => config('diyar.visual_search.sql_prefetch_cap', 1500),
            'explain' => $explain,
            'sql_prefetch_ms' => [
                'p50' => $latencies[(int) floor(count($latencies) * 0.5)] ?? null,
                'p95' => $latencies[(int) floor(count($latencies) * 0.95)] ?? null,
                'p99' => $latencies[count($latencies) - 1] ?? null,
            ],
            'full_search_http_ms' => count($searchLatencies) > 0 ? [
                'p50' => $searchLatencies[(int) floor(count($searchLatencies) * 0.5)],
                'p95' => $searchLatencies[(int) floor(count($searchLatencies) * 0.95)],
                'p99' => $searchLatencies[count($searchLatencies) - 1],
            ] : null,
        ]);
        writeJson("{$baseDir}/04-performance/cache.json", $cacheResult);
        writeJson("{$baseDir}/04-performance/bucket-probe-count.json", [
            'query_bucket' => $bucket,
            'probe_count' => count($buckets),
            'rows_returned' => VisualIndexEntry::query()
                ->where('is_active', true)
                ->where('index_version', $indexVersion)
                ->whereIn('hash_bucket', $buckets)
                ->count(),
        ]);
    }
}

// §5 Security — adversarial via HTTP
$disk = (string) config('diyar_media.disk', 'media');
$mediaBefore = count(Storage::disk($disk)->allFiles());
$eventsBefore = VisualSearchEvent::query()->count();

$securityCases = [];

$postCase = function (string $id, string $filename, string $bytes, string $mime) use (&$securityCases, $apiBase): void {
    $response = Http::attach('image', $bytes, $filename, ['Content-Type' => $mime])
        ->acceptJson()
        ->post("{$apiBase}/api/v1/search/visual");
    $securityCases[] = [
        'case' => $id,
        'status' => $response->status(),
        'message' => $response->json('message') ?? $response->json('errors.image.0'),
    ];
};

$postCase('valid_png', 'ok.png', makePng(64, 64), 'image/png');
$postCase('corrupt_binary', 'bad.jpg', random_bytes(512), 'image/jpeg');
$postCase('mime_spoof_html', 'fake.jpg', '<html>not an image</html>', 'image/jpeg');
$postCase('svg', 'icon.svg', '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>', 'image/svg+xml');
$postCase('oversized_2mb_plus', 'big.png', str_repeat('x', (2048 * 1024) + 1), 'image/png');
$postCase('dimension_2048_ok', 'ok2048.png', makePng(2048, 2048), 'image/png');
$postCase('dimension_2049', 'bad2049.png', makePng(2049, 100), 'image/png');
$postCase('pixels_over_4m', 'badpixels.png', makePng(3000, 2000), 'image/png');

writeJson("{$baseDir}/05-security/adversarial-results.json", $securityCases);

$mediaAfter = count(Storage::disk($disk)->allFiles());
writeText("{$baseDir}/05-security/storage-audit.txt", implode("\n", [
    "media_files_before: {$mediaBefore}",
    "media_files_after: {$mediaAfter}",
    'query_images_persisted: '.($mediaAfter > $mediaBefore ? 'POSSIBLE' : 'none detected'),
    'visual_search_events_before: '.$eventsBefore,
    'visual_search_events_after: '.VisualSearchEvent::query()->count(),
]));

// §6 Queue lifecycle
$lifecycle = [];
$product = Product::query()->publiclyVisible()->first();
if ($product !== null) {
    $png = makePng(300, 300, 10, 200, 30);
    $path = 'cert/visual-search/lifecycle-'.Str::uuid().'.png';
    Storage::disk($disk)->put($path, $png);
    $media = \App\Models\MediaFile::query()->create([
        'disk' => $disk,
        'path' => $path,
        'mime_type' => 'image/png',
        'size_bytes' => strlen($png),
    ]);
    $pi = ProductImage::query()->create([
        'product_id' => $product->id,
        'media_file_id' => $media->id,
        'sort_order' => 99,
    ]);
    IndexProductImageJob::dispatchSync($pi->id);
    $lifecycle['after_attach'] = VisualIndexEntry::query()->where('product_image_id', $pi->id)->where('is_active', true)->count();

    IndexProductImageJob::dispatchSync($pi->id);
    IndexProductImageJob::dispatchSync($pi->id);
    $lifecycle['after_triple_dispatch'] = VisualIndexEntry::query()->where('product_image_id', $pi->id)->count();

    $pi->delete();
    \App\Jobs\Search\RemoveVisualIndexEntryJob::dispatchSync($pi->id);
    $lifecycle['after_delete'] = VisualIndexEntry::query()->where('product_image_id', $pi->id)->where('is_active', true)->count();
}

writeJson("{$baseDir}/06-queue/lifecycle.json", $lifecycle);

// §8 Docker integration
writeJson("{$baseDir}/08-docker-integration/environment.json", [
    'php_version' => PHP_VERSION,
    'gd_loaded' => extension_loaded('gd'),
    'gd_info' => extension_loaded('gd') ? array_intersect_key(gd_info(), array_flip(['JPEG Support', 'PNG Support', 'WebP Support'])) : null,
    'visual_search_config' => config('diyar.visual_search'),
    'cache_store' => config('cache.default'),
    'queue_connection' => config('queue.default'),
    'app_url' => $apiBase,
]);

$smoke = Http::attach('image', makePng(64, 64), 'smoke.png', ['Content-Type' => 'image/png'])
    ->acceptJson()
    ->post("{$apiBase}/api/v1/search/visual");
writeJson("{$baseDir}/08-docker-integration/smoke-search.json", [
    'status' => $smoke->status(),
    'result_count' => $smoke->json('meta.result_count'),
    'cache' => $smoke->json('meta.cache'),
]);

writeJson("{$baseDir}/report-snapshot.json", [
    'generated_at' => gmdate('c'),
    'base_dir' => $baseDir,
    'indexing_set_difference_zero' => $indexing['set_difference_zero'],
    'accuracy_cases' => count($accuracyRows),
]);

echo "Phase 5 full certification evidence written to {$baseDir}\n";
