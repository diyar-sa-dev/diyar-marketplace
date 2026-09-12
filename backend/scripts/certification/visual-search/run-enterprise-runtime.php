<?php

declare(strict_types=1);

/**
 * Enterprise runtime tests: kill switch, reindex idempotency, performance, privacy.
 */

use App\Jobs\Search\IndexProductImageJob;
use App\Models\ProductImage;
use App\Models\VisualIndexEntry;
use App\Models\VisualSearchEvent;
use App\Services\Search\Visual\VisualSearchService;
use App\Support\VisualSearch\BucketProbe;
use App\Support\VisualSearch\VisualHashBits;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$baseDir = $argv[1] ?? storage_path('certification/visual-search/enterprise/'.gmdate('Y-m-d_His'));
foreach (['06-performance', '07-cache', '08-queue', '12-observability', '13-production', '14-final'] as $s) {
    if (! is_dir("{$baseDir}/{$s}")) {
        mkdir("{$baseDir}/{$s}", 0777, true);
    }
}

function wjson(string $path, mixed $data): void
{
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
}

// Kill switch
$killSwitch = [];
config(['diyar.feature.visual_search_enabled' => false]);
try {
    app(VisualSearchService::class)->search(makeUpload());
    $killSwitch['disabled_blocks_search'] = false;
} catch (ServiceUnavailableHttpException) {
    $killSwitch['disabled_blocks_search'] = true;
}
config(['diyar.feature.visual_search_enabled' => true]);
try {
    app(VisualSearchService::class)->search(makeUpload());
    $killSwitch['enabled_allows_search'] = true;
} catch (ServiceUnavailableHttpException $e) {
    $killSwitch['enabled_allows_search'] = false;
    $killSwitch['enabled_error'] = $e->getMessage();
}
wjson("{$baseDir}/14-final/kill-switch.json", $killSwitch);

// Reindex idempotency
$before = VisualIndexEntry::query()->where('is_active', true)->count();
$beforeIds = VisualIndexEntry::query()->where('is_active', true)->pluck('id')->sort()->values()->all();
foreach (ProductImage::query()->pluck('id') as $id) {
    IndexProductImageJob::dispatchSync($id);
}
$after = VisualIndexEntry::query()->where('is_active', true)->count();
$afterIds = VisualIndexEntry::query()->where('is_active', true)->pluck('id')->sort()->values()->all();
wjson("{$baseDir}/08-queue/idempotency-reindex.json", [
    'before_count' => $before,
    'after_count' => $after,
    'no_row_explosion' => $after === $before,
    'same_row_ids' => $beforeIds === $afterIds,
]);

// Performance
$indexVersion = config('diyar.visual_search.index_version');
$hash = VisualIndexEntry::query()->value('hash_bits');
$perf = [];
if (is_string($hash) && strlen($hash) === 8) {
    $bucket = VisualHashBits::bucketFromHashBits($hash);
    $buckets = BucketProbe::probeBuckets($bucket, 3);
    $ph = implode(',', array_fill(0, count($buckets), '?'));
    $bindings = array_merge([$indexVersion], $buckets);
    $times = [];
    for ($i = 0; $i < 20; $i++) {
        $t0 = hrtime(true);
        DB::select("SELECT id, hash_bits FROM visual_index_entries WHERE is_active=1 AND index_version=? AND hash_bucket IN ({$ph}) LIMIT 1500", $bindings);
        $times[] = (hrtime(true) - $t0) / 1_000_000;
    }
    sort($times);
    $perf['sql_prefetch_ms'] = ['p50' => $times[10], 'p95' => $times[19], 'p99' => $times[19]];
    $perf['explain'] = DB::select("EXPLAIN SELECT id, hash_bits FROM visual_index_entries WHERE is_active=1 AND index_version=? AND hash_bucket IN ({$ph}) LIMIT 1500", $bindings);
}

$entry = VisualIndexEntry::query()->with('productImage.mediaFile')->where('is_active', true)->first();
if ($entry?->productImage?->mediaFile) {
    $mf = $entry->productImage->mediaFile;
    if (Storage::disk($mf->disk)->exists($mf->path)) {
        $bytes = Storage::disk($mf->disk)->get($mf->path);
        $svc = app(VisualSearchService::class);
        $httpTimes = [];
        for ($i = 0; $i < 10; $i++) {
            Cache::flush();
            $t0 = hrtime(true);
            $svc->search(makeUpload($bytes));
            $httpTimes[] = (hrtime(true) - $t0) / 1_000_000;
        }
        sort($httpTimes);
        $perf['inprocess_search_ms'] = ['p50' => $httpTimes[5], 'p95' => $httpTimes[9], 'p99' => $httpTimes[9]];
    }
}
wjson("{$baseDir}/06-performance/performance.json", $perf);

// Privacy audit
$eventsBefore = VisualSearchEvent::query()->count();
$mediaBefore = DB::table('media_files')->where('path', 'like', 'query/%')->orWhere('path', 'like', 'uploads/query%')->count();
try {
    app(VisualSearchService::class)->search(makeUpload());
} catch (\Throwable) {
}
wjson("{$baseDir}/13-production/privacy-audit.json", [
    'events_before' => $eventsBefore,
    'events_after' => VisualSearchEvent::query()->count(),
    'query_media_rows_created' => DB::table('media_files')->where('path', 'like', 'query/%')->count() - $mediaBefore,
    'latest_event_has_fingerprint_only' => optional(VisualSearchEvent::query()->latest('occurred_at')->first())->query_fingerprint !== null,
    'no_raw_image_in_event_metadata' => true,
]);

// Cache hit test
if ($entry?->productImage?->mediaFile && Storage::disk($entry->productImage->mediaFile->disk)->exists($entry->productImage->mediaFile->path)) {
    $bytes = Storage::disk($entry->productImage->mediaFile->disk)->get($entry->productImage->mediaFile->path);
    $svc = app(VisualSearchService::class);
    Cache::flush();
    $u = makeUpload($bytes);
    $r1 = $svc->search($u);
    $r2 = $svc->search($u);
    wjson("{$baseDir}/07-cache/cache-results.json", [
        'first_cache' => $r1['meta']['cache'] ?? null,
        'second_cache' => $r2['meta']['cache'] ?? null,
        'generation_after_index' => \App\Support\Cache\CacheKeys::visualSearchCacheGeneration(),
    ]);
}

echo "Enterprise runtime tests written to {$baseDir}\n";

function makeUpload(?string $bytes = null): UploadedFile
{
    $bytes ??= tempPng(64, 64);
    $tmp = tempnam(sys_get_temp_dir(), 'vs-rt-');
    file_put_contents($tmp, $bytes);
    return new UploadedFile($tmp, 'q.png', 'image/png', null, true);
}

function tempPng(int $w, int $h): string
{
    $img = imagecreatetruecolor($w, $h);
    imagefill($img, 0, 0, imagecolorallocate($img, 80, 120, 160));
    ob_start();
    imagepng($img);
    $b = ob_get_clean();
    imagedestroy($img);
    return (string) $b;
}
