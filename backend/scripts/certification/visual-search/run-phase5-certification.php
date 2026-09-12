<?php

declare(strict_types=1);

/**
 * Phase 5 Visual Search certification runner.
 * Writes evidence to backend/storage/certification/visual-search/phase5/{timestamp}/
 *
 * Usage: php backend/scripts/certification/visual-search/run-phase5-certification.php
 */

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\VisualIndexEntry;
use App\Support\VisualSearch\BucketProbe;
use App\Support\VisualSearch\Dhash64Generator;
use App\Support\VisualSearch\VisualHashBits;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$timestamp = gmdate('Y-m-d_His');
$baseDir = storage_path("certification/visual-search/phase5/{$timestamp}");
foreach (['01-migration', '02-indexing', '03-accuracy', '04-performance', '05-security', '06-queue', '07-frontend-e2e', '08-docker-integration'] as $section) {
    if (! is_dir("{$baseDir}/{$section}")) {
        mkdir("{$baseDir}/{$section}", 0777, true);
    }
}

$report = [
    'generated_at' => gmdate('c'),
    'environment' => [
        'php_version' => PHP_VERSION,
        'gd_loaded' => extension_loaded('gd'),
        'app_env' => config('app.env'),
        'database' => config('database.default'),
    ],
    'sections' => [],
];

function writeJson(string $path, mixed $data): void
{
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
}

// §1 Migration
$migration = [
    'visual_index_entries_exists' => Schema::hasTable('visual_index_entries'),
    'visual_search_events_exists' => Schema::hasTable('visual_search_events'),
];
if ($migration['visual_index_entries_exists']) {
    $migration['indexes'] = DB::select("SHOW INDEX FROM visual_index_entries");
    $migration['create'] = DB::select('SHOW CREATE TABLE visual_index_entries');
}
writeJson("{$baseDir}/01-migration/schema-check.json", $migration);
$report['sections']['migration'] = $migration;

// §2 Indexing counts
$indexVersion = (string) config('diyar.visual_search.index_version', 'catalog-v1');
$eligible = DB::selectOne(<<<'SQL'
SELECT COUNT(DISTINCT pi.id) AS cnt
FROM product_images pi
INNER JOIN products p ON p.id = pi.product_id AND p.deleted_at IS NULL AND p.status = 'active'
INNER JOIN vendor_accounts va ON va.id = p.vendor_account_id AND va.status = 'active'
INNER JOIN media_files mf ON mf.id = pi.media_file_id
SQL);

$activeIndex = VisualIndexEntry::query()
    ->where('is_active', true)
    ->where('index_version', $indexVersion)
    ->count();

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

$eligibleIds = DB::table('product_images as pi')
    ->join('products as p', 'p.id', '=', 'pi.product_id')
    ->join('vendor_accounts as va', 'va.id', '=', 'p.vendor_account_id')
    ->join('media_files as mf', 'mf.id', '=', 'pi.media_file_id')
    ->whereNull('p.deleted_at')
    ->where('p.status', 'active')
    ->where('va.status', 'active')
    ->pluck('pi.id')
    ->all();

$indexedIds = VisualIndexEntry::query()
    ->where('is_active', true)
    ->where('index_version', $indexVersion)
    ->pluck('product_image_id')
    ->all();

$missingFromIndex = array_values(array_diff($eligibleIds, $indexedIds));
$extraInIndex = array_values(array_diff($indexedIds, $eligibleIds));

$indexing = [
    'index_version' => $indexVersion,
    'eligible_images' => (int) ($eligible->cnt ?? 0),
    'active_index_rows' => $activeIndex,
    'distinct_product_image_id' => $distinctProductImage,
    'distinct_media_file_id' => $distinctMedia,
    'unique_constraints_ok' => $distinctProductImage === $activeIndex && $distinctMedia === $activeIndex,
    'set_difference_missing_from_index' => $missingFromIndex,
    'set_difference_extra_in_index' => $extraInIndex,
    'set_difference_zero' => $missingFromIndex === [] && $extraInIndex === [],
];
writeJson("{$baseDir}/02-indexing/counts.json", $indexing);
$report['sections']['indexing'] = $indexing;

// §4 Performance - EXPLAIN + bucket probe
if (Schema::hasTable('visual_index_entries')) {
    $sampleHash = VisualIndexEntry::query()->value('hash_bits');
    if (is_string($sampleHash) && strlen($sampleHash) === 8) {
        $bucket = VisualHashBits::bucketFromHashBits($sampleHash);
        $buckets = BucketProbe::probeBuckets($bucket, (int) config('diyar.visual_search.bucket_probe_radius', 3));
        $placeholders = implode(',', array_fill(0, count($buckets), '?'));
        $sql = "EXPLAIN SELECT id, product_id, product_image_id, hash_bits FROM visual_index_entries WHERE is_active = 1 AND index_version = ? AND hash_bucket IN ({$placeholders}) LIMIT 1500";
        $bindings = array_merge([$indexVersion], $buckets);
        $explain = DB::select($sql, $bindings);

        $start = hrtime(true);
        DB::select(
            "SELECT id, product_id, product_image_id, hash_bits FROM visual_index_entries WHERE is_active = 1 AND index_version = ? AND hash_bucket IN ({$placeholders}) LIMIT 1500",
            $bindings,
        );
        $elapsedMs = (hrtime(true) - $start) / 1_000_000;

        $perf = [
            'probe_bucket_count' => count($buckets),
            'probe_radius' => config('diyar.visual_search.bucket_probe_radius', 3),
            'sql_prefetch_cap' => config('diyar.visual_search.sql_prefetch_cap', 1500),
            'explain' => $explain,
            'execution_ms' => $elapsedMs,
        ];

        // GD timing on temp png
        if (extension_loaded('gd')) {
            $pngPath = sys_get_temp_dir().'/diyar-phase5-perf.png';
            $img = imagecreatetruecolor(800, 600);
            imagepng($img, $pngPath);
            imagedestroy($img);
            $times = [];
            $gen = new Dhash64Generator((int) config('diyar.visual_search.working_dimension_px', 256));
            for ($i = 0; $i < 20; $i++) {
                $t0 = hrtime(true);
                $gen->fromFilePath($pngPath);
                $times[] = (hrtime(true) - $t0) / 1_000_000;
            }
            sort($times);
            $perf['gd_hash_ms'] = [
                'p50' => $times[(int) floor(count($times) * 0.5)],
                'p95' => $times[(int) floor(count($times) * 0.95)],
                'p99' => $times[count($times) - 1],
            ];
            @unlink($pngPath);
        }

        writeJson("{$baseDir}/04-performance/explain-and-latency.json", $perf);
        $report['sections']['performance'] = $perf;
    }
}

// §8 Docker integration snapshot
$docker = [
    'gd_info' => extension_loaded('gd') ? array_intersect_key(gd_info(), array_flip(['JPEG Support', 'PNG Support', 'WebP Support'])) : null,
    'visual_search_config' => config('diyar.visual_search'),
    'cache_store' => config('cache.default'),
    'queue_connection' => config('queue.default'),
];
writeJson("{$baseDir}/08-docker-integration/environment.json", $docker);
$report['sections']['docker_integration'] = $docker;

writeJson("{$baseDir}/report-snapshot.json", $report);

echo "Phase 5 certification snapshot written to {$baseDir}\n";
