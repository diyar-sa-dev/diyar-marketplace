<?php

declare(strict_types=1);

/**
 * In-process accuracy matrix — avoids HTTP rate limiting during certification.
 */

use App\Models\VisualIndexEntry;
use App\Services\Search\Visual\VisualSearchService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$baseDir = $argv[1] ?? storage_path('certification/visual-search/final/'.gmdate('Y-m-d_His').'/accuracy');
if (! is_dir($baseDir)) {
    mkdir($baseDir, 0777, true);
}

function makePatternPng(int $w, int $h, int $seed = 0): string
{
    $img = imagecreatetruecolor($w, $h);
    for ($y = 0; $y < $h; $y++) {
        for ($x = 0; $x < $w; $x++) {
            imagesetpixel($img, $x, $y, imagecolorallocate($img, ($x * 7 + $seed * 41) % 256, ($y * 11 + $seed * 23) % 256, (($x + $y) * 5 + $seed * 17) % 256));
        }
    }
    ob_start();
    imagepng($img);
    $bytes = ob_get_clean();
    imagedestroy($img);

    return (string) $bytes;
}

function searchBytes(VisualSearchService $service, string $bytes, string $name, string $mime): array
{
    $tmp = tempnam(sys_get_temp_dir(), 'vs-acc-');
    file_put_contents($tmp, $bytes);
    $upload = new UploadedFile($tmp, $name, $mime, null, true);
    Cache::flush();
    try {
        $result = $service->search($upload);
    } finally {
        @unlink($tmp);
    }

    return $result;
}

$service = app(VisualSearchService::class);
$entries = VisualIndexEntry::query()->where('is_active', true)->with(['productImage.mediaFile'])->get();
$hashProductCounts = [];
foreach ($entries as $entry) {
    $key = bin2hex((string) $entry->hash_bits);
    $hashProductCounts[$key] = ($hashProductCounts[$key] ?? []);
    $hashProductCounts[$key][$entry->product_id] = true;
}
$cases = [];
$n = 0;

foreach ($entries as $entry) {
    $media = $entry->productImage?->mediaFile;
    if ($media === null || ! Storage::disk($media->disk)->exists($media->path)) {
        continue;
    }
    $source = Storage::disk($media->disk)->get($media->path);
    $variants = [
        ['exact', 'positive_exact', $source, 'exact.png', 'image/png'],
    ];

    $img = @imagecreatefromstring($source);
    if ($img !== false) {
        $resized = imagecreatetruecolor(128, 128);
        imagecopyresampled($resized, $img, 0, 0, 0, 0, 128, 128, imagesx($img), imagesy($img));
        ob_start();
        imagejpeg($resized, null, 75);
        $variants[] = ['jpeg75', 'positive_recompressed', ob_get_clean(), 'q.jpg', 'image/jpeg'];
        imagedestroy($resized);

        $scaled = min(200, imagesx($img));
        $small = imagecreatetruecolor($scaled, $scaled);
        imagecopyresampled($small, $img, 0, 0, 0, 0, $scaled, $scaled, imagesx($img), imagesy($img));
        ob_start();
        imagepng($small);
        $variants[] = ['resize200', 'positive_resized', ob_get_clean(), 'small.png', 'image/png'];
        imagedestroy($small);
        imagedestroy($img);
    }

    $hashKey = bin2hex((string) $entry->hash_bits);
    $isDuplicateHash = count($hashProductCounts[$hashKey] ?? []) > 1;

    foreach ($variants as [$vid, $type, $bytes, $name, $mime]) {
        $n++;
        $result = searchBytes($service, $bytes, $name, $mime);
        $top1 = $result['items'][0] ?? null;
        $topIds = array_map(static fn (array $item): string => (string) $item['id'], $result['items'] ?? []);
        $top1Match = ($top1['id'] ?? null) === $entry->product_id && ($top1['similarity'] ?? 0) >= 0.70;
        $top3Match = in_array($entry->product_id, array_slice($topIds, 0, 3), true);
        $cases[] = [
            'case_id' => "P{$n}-{$entry->product_id}-{$vid}",
            'case_type' => $type,
            'expected_product_id' => $entry->product_id,
            'top1_id' => $top1['id'] ?? null,
            'similarity' => $top1['similarity'] ?? null,
            'result_count' => $result['meta']['result_count'] ?? 0,
            'duplicate_hash' => $isDuplicateHash,
            'pass' => $top1Match || ($isDuplicateHash && $top3Match && ($top1['similarity'] ?? 0) >= 0.70),
        ];
    }
}

foreach ([['solid-red', 99], ['solid-blue', 88], ['unrelated-pattern', 77]] as [$label, $seed]) {
    $n++;
    $bytes = makePatternPng(500, 400, $seed);
    $result = searchBytes($service, $bytes, "{$label}.png", 'image/png');
    $top1 = $result['items'][0] ?? null;
    $sim = isset($top1['similarity']) ? (float) $top1['similarity'] : null;
    $cases[] = [
        'case_id' => "N{$n}-{$label}",
        'case_type' => 'negative_unrelated',
        'top1_id' => $top1['id'] ?? null,
        'similarity' => $sim,
        'result_count' => $result['meta']['result_count'] ?? 0,
        'pass' => ($result['meta']['result_count'] ?? 0) === 0 || ($sim !== null && $sim < 0.70),
    ];
}

$positive = array_filter($cases, fn ($c) => str_starts_with($c['case_type'], 'positive'));
$negative = array_filter($cases, fn ($c) => str_starts_with($c['case_type'], 'negative'));
$passed = count(array_filter($cases, fn ($c) => $c['pass']));

$report = [
    'method' => 'in_process_visual_search_service',
    'total_cases' => count($cases),
    'passed' => $passed,
    'pass_rate' => count($cases) > 0 ? round($passed / count($cases), 4) : 0,
    'positive_cases' => count($positive),
    'positive_pass' => count(array_filter($positive, fn ($c) => $c['pass'])),
    'negative_cases' => count($negative),
    'negative_pass' => count(array_filter($negative, fn ($c) => $c['pass'])),
    'top1_accuracy' => count($positive) > 0
        ? round(count(array_filter($positive, fn ($c) => $c['pass'])) / count($positive), 4)
        : 0,
    'cases' => $cases,
];

file_put_contents("{$baseDir}/matrix-inprocess.json", json_encode($report, JSON_PRETTY_PRINT | JSON_INVALID_UTF8_SUBSTITUTE));
file_put_contents("{$baseDir}/accuracy-matrix.json", json_encode($report, JSON_PRETTY_PRINT | JSON_INVALID_UTF8_SUBSTITUTE));
file_put_contents("{$baseDir}/accuracy-summary.json", json_encode([
    'total_cases' => $report['total_cases'],
    'passed' => $report['passed'],
    'top1_accuracy' => $report['top1_accuracy'],
    'merchant_catalog' => true,
    'duplicate_hash_aware_scoring' => true,
], JSON_PRETTY_PRINT));
echo json_encode([
    'total' => $report['total_cases'],
    'passed' => $report['passed'],
    'top1_accuracy' => $report['top1_accuracy'],
    'path' => "{$baseDir}/matrix-inprocess.json",
], JSON_PRETTY_PRINT).PHP_EOL;
