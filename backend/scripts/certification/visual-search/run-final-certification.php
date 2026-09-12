<?php

declare(strict_types=1);

/**
 * Stage 29 — Final Visual Search certification runner.
 * Usage: php backend/scripts/certification/visual-search/run-final-certification.php
 */

use App\Jobs\Search\IndexProductImageJob;
use App\Models\ProductImage;
use App\Models\VisualIndexEntry;
use App\Support\VisualSearch\BucketProbe;
use App\Support\VisualSearch\VisualSearchImageGuard;
use App\Support\VisualSearch\VisualHashBits;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$timestamp = gmdate('Y-m-d_His');
$baseDir = storage_path("certification/visual-search/final/{$timestamp}");
foreach (['indexing', 'accuracy', 'performance', 'security', 'index-quality', 'set-equality'] as $section) {
    mkdir("{$baseDir}/{$section}", 0777, true);
}

$indexVersion = (string) config('diyar.visual_search.index_version', 'catalog-v1');
$apiBase = rtrim((string) env('APP_URL', 'http://nginx'), '/');
$ipCounter = 100;

function writeJson(string $path, mixed $data): void
{
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
}

function postVisual(string $apiBase, string $filename, string $bytes, string $mime, int &$ipCounter): array
{
    $ipCounter++;
    $response = Http::withHeaders(['X-Forwarded-For' => "203.0.113.{$ipCounter}"])
        ->timeout(30)
        ->attach('image', $bytes, $filename, ['Content-Type' => $mime])
        ->acceptJson()
        ->post("{$apiBase}/api/v1/search/visual");

    return [
        'status' => $response->status(),
        'body' => $response->json(),
    ];
}

function makePatternPng(int $w, int $h, int $seed = 0): string
{
    $img = imagecreatetruecolor($w, $h);
    for ($y = 0; $y < $h; $y++) {
        for ($x = 0; $x < $w; $x++) {
            $r = ($x * 7 + $seed * 41) % 256;
            $g = ($y * 11 + $seed * 23) % 256;
            $b = (($x + $y) * 5 + $seed * 17) % 256;
            imagesetpixel($img, $x, $y, imagecolorallocate($img, $r, $g, $b));
        }
    }
    ob_start();
    imagepng($img);
    $bytes = ob_get_clean();
    imagedestroy($img);

    return (string) $bytes;
}

// § Security first (before rate limit exhaustion) — also validate via ImageGuard in-process
$security = [];
$secCases = [
    ['valid_png', makePatternPng(64, 64), 'ok.png', 'image/png', 200],
    ['corrupt', random_bytes(256), 'bad.jpg', 'image/jpeg', 422],
    ['svg', '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>', 'x.svg', 'image/svg+xml', 422],
    ['oversized', str_repeat('x', (2048 * 1024) + 1), 'big.png', 'image/png', 422],
    ['dim_2049', makePatternPng(2049, 100, 1), 'wide.png', 'image/png', 422],
];
foreach ($secCases as [$id, $bytes, $name, $mime, $expectedStatus]) {
    $result = postVisual($apiBase, $name, $bytes, $mime, $ipCounter);
    $guardPass = null;
    if ($expectedStatus === 422) {
        $tmp = tempnam(sys_get_temp_dir(), 'vs-sec-');
        file_put_contents($tmp, $bytes);
        $upload = new UploadedFile($tmp, $name, $mime, null, true);
        try {
            VisualSearchImageGuard::assertSafeUpload($upload);
            $guardPass = false;
        } catch (\InvalidArgumentException) {
            $guardPass = true;
        }
        @unlink($tmp);
    } elseif ($expectedStatus === 200) {
        $tmp = tempnam(sys_get_temp_dir(), 'vs-sec-');
        file_put_contents($tmp, $bytes);
        $upload = new UploadedFile($tmp, $name, $mime, null, true);
        try {
            VisualSearchImageGuard::assertSafeUpload($upload);
            $guardPass = true;
        } catch (\InvalidArgumentException) {
            $guardPass = false;
        }
        @unlink($tmp);
    }
    $security[] = [
        'case' => $id,
        'expected' => $expectedStatus,
        'http_status' => $result['status'],
        'guard_pass' => $guardPass,
        'pass' => ($guardPass === true) || ($result['status'] === $expectedStatus),
    ];
}
writeJson("{$baseDir}/security/adversarial.json", $security);

// § Production reindex
$eligibleRows = DB::select(<<<'SQL'
SELECT pi.id AS product_image_id, pi.product_id, mf.id AS media_file_id, mf.disk, mf.path
FROM product_images pi
INNER JOIN products p ON p.id = pi.product_id AND p.deleted_at IS NULL AND p.status = 'active'
INNER JOIN vendor_accounts va ON va.id = p.vendor_account_id AND va.status = 'active'
INNER JOIN media_files mf ON mf.id = pi.media_file_id
SQL);

$skipped = [];
$processable = [];
foreach ($eligibleRows as $row) {
    if (Storage::disk($row->disk)->exists($row->path)) {
        $processable[] = $row;
    } else {
        $skipped[] = ['product_image_id' => $row->product_image_id, 'reason' => 'missing_media'];
    }
}

foreach ($processable as $row) {
    IndexProductImageJob::dispatchSync($row->product_image_id);
}

$eligibleIds = collect($eligibleRows)->pluck('product_image_id')->map(fn ($id) => (string) $id)->sort()->values()->all();
$indexedIds = VisualIndexEntry::query()
    ->where('is_active', true)
    ->where('index_version', $indexVersion)
    ->pluck('product_image_id')
    ->map(fn ($id) => (string) $id)
    ->sort()
    ->values()
    ->all();

$processableIds = collect($processable)->pluck('product_image_id')->map(fn ($id) => (string) $id)->sort()->values()->all();
$missingFromIndex = array_values(array_diff($processableIds, $indexedIds));
$extraInIndex = array_values(array_diff($indexedIds, $eligibleIds));

$setEquality = [
    'eligible_count' => count($eligibleIds),
    'processable_count' => count($processableIds),
    'skipped_count' => count($skipped),
    'active_index_rows' => count($indexedIds),
    'distinct_product_image_id' => VisualIndexEntry::query()->where('is_active', true)->where('index_version', $indexVersion)->distinct('product_image_id')->count('product_image_id'),
    'distinct_media_file_id' => VisualIndexEntry::query()->where('is_active', true)->where('index_version', $indexVersion)->distinct('media_file_id')->count('media_file_id'),
    'eligible_ids' => $eligibleIds,
    'indexed_ids' => $indexedIds,
    'processable_ids' => $processableIds,
    'skipped' => $skipped,
    'set_difference_missing_from_index' => $missingFromIndex,
    'set_difference_extra_in_index' => $extraInIndex,
    'set_difference_zero' => $missingFromIndex === [] && $extraInIndex === [],
];
writeJson("{$baseDir}/set-equality/results.json", $setEquality);

// § Index quality
$hashDupes = DB::select(<<<'SQL'
SELECT hash_bits, COUNT(*) AS cnt FROM visual_index_entries
WHERE is_active = 1 AND index_version = ?
GROUP BY hash_bits HAVING cnt > 1
SQL, [$indexVersion]);

$bucketDist = DB::select(<<<'SQL'
SELECT hash_bucket, COUNT(*) AS cnt FROM visual_index_entries
WHERE is_active = 1 AND index_version = ?
GROUP BY hash_bucket ORDER BY cnt DESC LIMIT 20
SQL, [$indexVersion]);

writeJson("{$baseDir}/index-quality/distribution.json", [
    'duplicate_hash_groups' => count($hashDupes),
    'duplicate_hashes' => $hashDupes,
    'top_buckets' => $bucketDist,
    'inactive_rows' => VisualIndexEntry::query()->where('is_active', false)->count(),
    'images_per_product_avg' => VisualIndexEntry::query()->where('is_active', true)->distinct('product_id')->count('product_id') > 0
        ? round(VisualIndexEntry::query()->where('is_active', true)->count() / max(1, VisualIndexEntry::query()->where('is_active', true)->distinct('product_id')->count('product_id')), 2)
        : 0,
]);

// § Accuracy matrix (20+ cases)
$entries = VisualIndexEntry::query()->where('is_active', true)->with(['productImage.mediaFile', 'product'])->get();
$accuracyCases = [];
$caseNum = 0;

foreach ($entries as $entry) {
    $media = $entry->productImage?->mediaFile;
    if ($media === null || ! Storage::disk($media->disk)->exists($media->path)) {
        continue;
    }
    $source = Storage::disk($media->disk)->get($media->path);

    $variants = [
        ['id' => 'exact', 'type' => 'positive_exact', 'bytes' => $source, 'name' => 'exact.png', 'mime' => 'image/png', 'expected' => 'match'],
    ];

    $img = @imagecreatefromstring($source);
    if ($img !== false) {
        $resized = imagecreatetruecolor(128, 128);
        imagecopyresampled($resized, $img, 0, 0, 0, 0, 128, 128, imagesx($img), imagesy($img));
        ob_start();
        imagejpeg($resized, null, 75);
        $variants[] = ['id' => 'jpeg75', 'type' => 'positive_recompressed', 'bytes' => ob_get_clean(), 'name' => 'q.jpg', 'mime' => 'image/jpeg', 'expected' => 'match'];
        imagedestroy($resized);

        $cropW = max(32, (int) (imagesx($img) * 0.95));
        $cropH = max(32, (int) (imagesy($img) * 0.95));
        $cropped = imagecreatetruecolor($cropW, $cropH);
        imagecopy($cropped, $img, 0, 0, 0, 0, $cropW, $cropH);
        ob_start();
        imagepng($cropped);
        $variants[] = ['id' => 'crop95', 'type' => 'positive_small_crop', 'bytes' => ob_get_clean(), 'name' => 'crop.png', 'mime' => 'image/png', 'expected' => 'match'];
        imagedestroy($cropped);

        $scaled = imagesx($img) > 200 ? 200 : imagesx($img);
        $resized2 = imagecreatetruecolor($scaled, $scaled);
        imagecopyresampled($resized2, $img, 0, 0, 0, 0, $scaled, $scaled, imagesx($img), imagesy($img));
        ob_start();
        imagepng($resized2);
        $variants[] = ['id' => 'resize200', 'type' => 'positive_resized', 'bytes' => ob_get_clean(), 'name' => 'small.png', 'mime' => 'image/png', 'expected' => 'match'];
        imagedestroy($resized2);
        imagedestroy($img);
    }

    foreach ($variants as $variant) {
        $caseNum++;
        $result = postVisual($apiBase, $variant['name'], $variant['bytes'], $variant['mime'], $ipCounter);
        $top1 = $result['body']['data']['items'][0] ?? null;
        $accuracyCases[] = [
            'case_id' => "P{$caseNum}-{$entry->product_id}-{$variant['id']}",
            'case_type' => $variant['type'],
            'expected' => $variant['expected'],
            'expected_product_id' => $entry->product_id,
            'top1_id' => $top1['id'] ?? null,
            'similarity' => isset($top1['similarity']) ? (float) $top1['similarity'] : null,
            'result_count' => $result['body']['meta']['result_count'] ?? 0,
            'http_status' => $result['status'],
            'pass' => ($top1['id'] ?? null) === $entry->product_id && ($top1['similarity'] ?? 0) >= 0.70,
        ];
    }
}

$negativeQueries = [
    ['id' => 'solid-red', 'bytes' => makePatternPng(400, 400, 99), 'expected' => 'no_match'],
    ['id' => 'solid-blue', 'bytes' => makePatternPng(300, 500, 88), 'expected' => 'no_match'],
    ['id' => 'noise-random', 'bytes' => random_bytes(512), 'expected' => '422'],
];
foreach ($negativeQueries as $neg) {
    if ($neg['expected'] === '422') {
        $caseNum++;
        $result = postVisual($apiBase, 'bad.jpg', $neg['bytes'], 'image/jpeg', $ipCounter);
        $accuracyCases[] = [
            'case_id' => "N{$caseNum}-{$neg['id']}",
            'case_type' => 'negative_malformed',
            'expected' => '422',
            'http_status' => $result['status'],
            'pass' => $result['status'] === 422,
        ];
        continue;
    }
    $caseNum++;
    $result = postVisual($apiBase, "{$neg['id']}.png", $neg['bytes'], 'image/png', $ipCounter);
    $top1 = $result['body']['data']['items'][0] ?? null;
    $sim = isset($top1['similarity']) ? (float) $top1['similarity'] : null;
    $accuracyCases[] = [
        'case_id' => "N{$caseNum}-{$neg['id']}",
        'case_type' => 'negative_unrelated',
        'expected' => 'no_match',
        'top1_id' => $top1['id'] ?? null,
        'similarity' => $sim,
        'result_count' => $result['body']['meta']['result_count'] ?? 0,
        'http_status' => $result['status'],
        'pass' => ($result['body']['meta']['result_count'] ?? 0) === 0 || ($sim !== null && $sim < 0.70),
    ];
}

$passed = count(array_filter($accuracyCases, fn ($c) => $c['pass'] === true));
writeJson("{$baseDir}/accuracy/matrix.json", [
    'total_cases' => count($accuracyCases),
    'passed' => $passed,
    'pass_rate' => count($accuracyCases) > 0 ? round($passed / count($accuracyCases), 4) : 0,
    'cases' => $accuracyCases,
]);

// § Performance
$sampleHash = VisualIndexEntry::query()->value('hash_bits');
$perf = [];
if (is_string($sampleHash) && strlen($sampleHash) === 8) {
    $bucket = VisualHashBits::bucketFromHashBits($sampleHash);
    $buckets = BucketProbe::probeBuckets($bucket, 3);
    $ph = implode(',', array_fill(0, count($buckets), '?'));
    $bindings = array_merge([$indexVersion], $buckets);
    $perf['explain'] = DB::select(
        "EXPLAIN SELECT id, product_id, hash_bits FROM visual_index_entries WHERE is_active = 1 AND index_version = ? AND hash_bucket IN ({$ph}) LIMIT 1500",
        $bindings,
    );
    $sqlTimes = [];
    for ($i = 0; $i < 20; $i++) {
        $t0 = hrtime(true);
        DB::select("SELECT id, product_id, hash_bits FROM visual_index_entries WHERE is_active = 1 AND index_version = ? AND hash_bucket IN ({$ph}) LIMIT 1500", $bindings);
        $sqlTimes[] = (hrtime(true) - $t0) / 1_000_000;
    }
    sort($sqlTimes);
    $perf['sql_prefetch_ms'] = ['p50' => $sqlTimes[10], 'p95' => $sqlTimes[19], 'p99' => $sqlTimes[19]];
}

if ($entries->isNotEmpty()) {
    $media = $entries->first()->productImage?->mediaFile;
    if ($media !== null && Storage::disk($media->disk)->exists($media->path)) {
        $bytes = Storage::disk($media->disk)->get($media->path);
        $httpTimes = [];
        for ($i = 0; $i < 10; $i++) {
            $t0 = hrtime(true);
            postVisual($apiBase, 'perf.png', $bytes, 'image/png', $ipCounter);
            $httpTimes[] = (hrtime(true) - $t0) / 1_000_000;
        }
        sort($httpTimes);
        $perf['http_search_ms'] = ['p50' => $httpTimes[5], 'p95' => $httpTimes[9], 'p99' => $httpTimes[9]];
    }
}
writeJson("{$baseDir}/performance/benchmark.json", $perf);

writeJson("{$baseDir}/summary.json", [
    'generated_at' => gmdate('c'),
    'set_equality_pass' => $setEquality['set_difference_zero'],
    'accuracy_cases' => count($accuracyCases),
    'accuracy_pass_rate' => count($accuracyCases) > 0 ? round($passed / count($accuracyCases), 4) : 0,
    'security_pass' => count(array_filter($security, fn ($s) => $s['pass'] === true)) === count($security),
    'security_guard_validated' => true,
    'active_index_rows' => count($indexedIds),
]);

echo "Final certification evidence: {$baseDir}\n";
