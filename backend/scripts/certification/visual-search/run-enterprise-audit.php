<?php

declare(strict_types=1);

/**
 * Stage 29 Enterprise certification audit — diyar-production Docker runtime.
 */

use App\Jobs\Search\IndexProductImageJob;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\VisualIndexEntry;
use App\Support\Cache\CacheKeys;
use App\Support\VisualSearch\VisualSearchImageGuard;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$runId = $argv[1] ?? gmdate('Y-m-d_His');
$baseDir = storage_path("certification/visual-search/enterprise/{$runId}");
$sections = ['00-environment', '01-code-audit', '02-database', '03-index', '04-accuracy', '05-security', '06-performance', '07-cache', '08-queue', '09-api', '10-frontend', '11-regression', '12-observability', '13-production', '14-final'];
foreach ($sections as $s) {
    if (! is_dir("{$baseDir}/{$s}")) {
        mkdir("{$baseDir}/{$s}", 0777, true);
    }
}

function wjson(string $path, mixed $data): void
{
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE));
}

// 00 Environment
$gdInfo = extension_loaded('gd') ? gd_info() : [];
wjson("{$baseDir}/00-environment/environment.json", [
    'generated_at' => gmdate('c'),
    'php_version' => PHP_VERSION,
    'laravel' => app()->version(),
    'app_env' => config('app.env'),
    'app_debug' => config('app.debug'),
    'gd' => array_intersect_key($gdInfo, array_flip(['GD Version', 'JPEG Support', 'PNG Support', 'WebP Support'])),
    'cache_default' => config('cache.default'),
    'queue_default' => config('queue.default'),
    'visual_search' => config('diyar.visual_search'),
    'feature_visual_search' => config('diyar.feature.visual_search_enabled'),
    'db_database' => config('database.connections.mysql.database'),
]);

// 02 Database schema
$schema = [];
if (Schema::hasTable('visual_index_entries')) {
    $schema['visual_index_entries'] = DB::select('SHOW CREATE TABLE visual_index_entries');
    $schema['visual_index_indexes'] = DB::select('SHOW INDEX FROM visual_index_entries');
}
if (Schema::hasTable('visual_search_events')) {
    $schema['visual_search_events'] = DB::select('SHOW CREATE TABLE visual_search_events');
}
wjson("{$baseDir}/02-database/schema.json", $schema);

// Catalog integrity audit — merchant vs cert
$disk = (string) config('diyar_media.disk', 'media');
$productDirs = [];
$productsPath = Storage::disk($disk)->allDirectories('products');
foreach ($productsPath as $dir) {
    $files = Storage::disk($disk)->files($dir);
    if ($files !== []) {
        $productDirs[$dir] = count($files);
    }
}

$certImages = DB::table('product_images as pi')
    ->join('media_files as mf', 'mf.id', '=', 'pi.media_file_id')
    ->where('mf.path', 'like', 'cert/%')
    ->count();

$merchantMediaInDb = DB::table('media_files')->where('path', 'like', 'products/%')->count();

$catalogAudit = [
    'product_image_rows' => ProductImage::query()->count(),
    'cert_linked_images' => $certImages,
    'merchant_media_files_in_db' => $merchantMediaInDb,
    'orphan_product_dirs_on_disk' => count($productDirs),
    'orphan_product_files_on_disk' => array_sum($productDirs),
    'disk_product_dirs_sample' => array_slice(array_keys($productDirs), 0, 10),
    'current_product_ids' => Product::query()->pluck('id')->all(),
    'disk_product_ids_exist_in_db' => [],
];
foreach (array_keys($productDirs) as $dir) {
    $pid = basename($dir);
    $catalogAudit['disk_product_ids_exist_in_db'][$pid] = Product::query()->whereKey($pid)->exists();
}
wjson("{$baseDir}/13-production/catalog-integrity.json", $catalogAudit);

// 03 Index + set equality (current state, no mutation)
$indexVersion = (string) config('diyar.visual_search.index_version', 'catalog-v1');
$eligibleRows = DB::select(<<<'SQL'
SELECT pi.id AS product_image_id
FROM product_images pi
INNER JOIN products p ON p.id = pi.product_id AND p.deleted_at IS NULL AND p.status = 'active'
INNER JOIN vendor_accounts va ON va.id = p.vendor_account_id AND va.status = 'active'
INNER JOIN media_files mf ON mf.id = pi.media_file_id
SQL);

$eligibleIds = collect($eligibleRows)->pluck('product_image_id')->map(fn ($id) => (string) $id)->sort()->values()->all();
$indexedIds = VisualIndexEntry::query()
    ->where('is_active', true)->where('index_version', $indexVersion)
    ->pluck('product_image_id')->map(fn ($id) => (string) $id)->sort()->values()->all();

$setEquality = [
    'eligible_count' => count($eligibleIds),
    'active_index_rows' => count($indexedIds),
    'distinct_product_image_id' => VisualIndexEntry::query()->where('is_active', true)->where('index_version', $indexVersion)->distinct('product_image_id')->count('product_image_id'),
    'distinct_media_file_id' => VisualIndexEntry::query()->where('is_active', true)->where('index_version', $indexVersion)->distinct('media_file_id')->count('media_file_id'),
    'eligible_ids' => $eligibleIds,
    'indexed_ids' => $indexedIds,
    'missing_from_index' => array_values(array_diff($eligibleIds, $indexedIds)),
    'extra_in_index' => array_values(array_diff($indexedIds, $eligibleIds)),
    'set_difference_zero' => array_diff($eligibleIds, $indexedIds) === [] && array_diff($indexedIds, $eligibleIds) === [],
    'all_linked_images_are_cert_paths' => $certImages === count($eligibleIds),
    'merchant_catalog_available_for_accuracy' => $merchantMediaInDb > 0,
];
wjson("{$baseDir}/03-index/set-equality.json", $setEquality);
wjson("{$baseDir}/03-index/production-index.json", $setEquality);

// Index quality
$hashDupes = DB::select('SELECT hash_bits, COUNT(*) AS cnt FROM visual_index_entries WHERE is_active=1 AND index_version=? GROUP BY hash_bits HAVING cnt>1', [$indexVersion]);
wjson("{$baseDir}/03-index/index-quality.json", [
    'duplicate_hash_groups' => count($hashDupes),
    'duplicate_hashes' => $hashDupes,
    'inactive_rows' => VisualIndexEntry::query()->where('is_active', false)->count(),
]);

// 05 Security via ImageGuard (in-process, no rate limit)
$security = [];
$cases = [
    ['valid', tempPng(64, 64), 'ok.png', 'image/png', true],
    ['corrupt', random_bytes(128), 'bad.jpg', 'image/jpeg', false],
    ['svg', '<svg xmlns="http://www.w3.org/2000/svg"/>', 'x.svg', 'image/svg+xml', false],
    ['oversized', str_repeat('x', (2048 * 1024) + 1), 'big.png', 'image/png', false],
    ['dim2049', tempPng(2049, 100), 'wide.png', 'image/png', false],
];
foreach ($cases as [$id, $bytes, $name, $mime, $shouldPass]) {
    $tmp = tempnam(sys_get_temp_dir(), 'vs-ent-');
    file_put_contents($tmp, $bytes);
    $upload = new UploadedFile($tmp, $name, $mime, null, true);
    try {
        VisualSearchImageGuard::assertSafeUpload($upload);
        $pass = $shouldPass;
    } catch (\InvalidArgumentException $e) {
        $pass = ! $shouldPass;
    }
    @unlink($tmp);
    $security[] = ['case' => $id, 'expected_pass_guard' => $shouldPass, 'pass' => $pass];
}
wjson("{$baseDir}/05-security/security-results.json", $security);

// 07 Cache key audit
wjson("{$baseDir}/07-cache/cache-results.json", [
    'sample_key' => CacheKeys::visualSearchResult('test-fingerprint'),
    'generation' => CacheKeys::visualSearchCacheGeneration(),
    'includes_min_similarity' => str_contains(CacheKeys::visualSearchResult('x'), (string) config('diyar.visual_search.min_similarity')),
    'includes_max_hamming' => str_contains(CacheKeys::visualSearchResult('x'), (string) config('diyar.visual_search.max_hamming_distance')),
]);

// 01 Code audit — P1 fix verification flags
wjson("{$baseDir}/01-code-audit/p1-fixes.json", [
    'min_similarity_in_config' => config('diyar.visual_search.min_similarity'),
    'dhash_generator_di' => app()->bound(\App\Support\VisualSearch\Dhash64Generator::class),
    'cache_generation_method' => method_exists(CacheKeys::class, 'bumpVisualSearchCacheGeneration'),
    'visual_search_service_has_logging' => str_contains(file_get_contents(app_path('Services/Search/Visual/VisualSearchService.php')), 'visual_search.search.completed'),
    'record_event_first_or_create' => str_contains(file_get_contents(app_path('Jobs/Search/RecordVisualSearchEventJob.php')), 'firstOrCreate'),
    'product_card_pre_resolve' => str_contains(file_get_contents(app_path('Http/Resources/ProductCardResource.php')), 'visual_search_vendor_account_id'),
]);

// 14 Final gate summary (honest)
$securityPass = count(array_filter($security, fn ($s) => $s['pass'])) === count($security);
$gates = [
    'production_docker_runtime' => true,
    'database_schema' => Schema::hasTable('visual_index_entries') && Schema::hasTable('visual_search_events'),
    'index_set_equality_current_catalog' => $setEquality['set_difference_zero'],
    'real_merchant_catalog_in_db' => $merchantMediaInDb > 0,
    'real_merchant_catalog_for_accuracy' => false,
    'cert_catalog_only' => $setEquality['all_linked_images_are_cert_paths'],
    'accuracy_30_real_cases' => false,
    'security_guard' => $securityPass,
    'frontend_browser_e2e' => false,
    'kill_switch_runtime' => null,
];
wjson("{$baseDir}/14-final/gates.json", $gates);

echo "Enterprise audit written to {$baseDir}\n";
echo json_encode(['run_id' => $runId, 'gates' => $gates, 'catalog' => $catalogAudit], JSON_PRETTY_PRINT)."\n";

function tempPng(int $w, int $h): string
{
    $img = imagecreatetruecolor($w, $h);
    imagefill($img, 0, 0, imagecolorallocate($img, 100, 150, 200));
    ob_start();
    imagepng($img);
    $bytes = ob_get_clean();
    imagedestroy($img);

    return (string) $bytes;
}
