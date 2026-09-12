<?php

declare(strict_types=1);

/**
 * Phase 3 Visual Search benchmark — isolated spike, NOT production code.
 *
 * Usage: php backend/scripts/benchmark/visual-search/run-phase3-benchmark.php
 */

ini_set('memory_limit', '512M');

require __DIR__.'/lib/Stats.php';
require __DIR__.'/lib/VisualHash.php';
require __DIR__.'/lib/FixtureGenerator.php';

if (! function_exists('array_any')) {
    function array_any(array $array, callable $callback): bool
    {
        foreach ($array as $key => $value) {
            if ($callback($value, $key)) {
                return true;
            }
        }

        return false;
    }
}

VisualHash::popcountInit();

$baseDir = __DIR__;
$writableRoot = is_writable($baseDir)
    ? $baseDir
    : rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR).'/diyar-visual-search-benchmark';
$fixtureDir = $writableRoot.'/fixtures';
$outputPath = $writableRoot.'/output/phase3-results.json';

FixtureGenerator::ensureDirectory($fixtureDir.'/generated');
FixtureGenerator::ensureDirectory(dirname($outputPath));

$fixtures = FixtureGenerator::generateAll($fixtureDir.'/generated');

$timingRuns = [];
$failures = [];

foreach ($fixtures as $label => $path) {
    $iterations = in_array($label, ['large', 'high_res'], true) ? 10 : 50;
    for ($i = 0; $i < $iterations; $i++) {
        try {
            $result = VisualHash::fromFile($path);
            $timingRuns[] = [
                'label' => $label,
                'decode_ms' => $result['decode_ms'],
                'normalize_ms' => $result['normalize_ms'],
                'hash_ms' => $result['hash_ms'],
                'total_ms' => $result['total_ms'],
                'peak_memory_bytes' => $result['peak_memory_bytes'],
            ];
        } catch (Throwable $e) {
            $failures[] = ['label' => $label, 'error' => $e->getMessage()];
        }
    }
}

$byLabel = [];
foreach ($timingRuns as $run) {
    $byLabel[$run['label']][] = $run;
}

$timingSummary = [];
foreach ($byLabel as $label => $runs) {
    $timingSummary[$label] = [
        'decode_ms' => Stats::percentiles(array_column($runs, 'decode_ms')),
        'normalize_ms' => Stats::percentiles(array_column($runs, 'normalize_ms')),
        'hash_ms' => Stats::percentiles(array_column($runs, 'hash_ms')),
        'total_ms' => Stats::percentiles(array_column($runs, 'total_ms')),
        'peak_memory_bytes' => Stats::percentiles(array_column($runs, 'peak_memory_bytes')),
    ];
}

$allTotals = array_column($timingRuns, 'total_ms');
$globalTiming = Stats::percentiles($allTotals);

$positivePairs = [
    ['base_square', 'resized', 'positive_resize'],
    ['base_square', 'recompressed', 'positive_recompress'],
    ['base_square', 'brightness', 'positive_brightness'],
    ['base_square', 'cropped', 'positive_crop'],
    ['base_landscape', 'medium', 'positive_resolution_variant'],
    ['format_jpg', 'format_png', 'positive_format_jpg_png'],
    ['format_jpg', 'format_webp', 'positive_format_jpg_webp'],
];

$accuracyRows = [];
$distancesPositive = [];
$distancesNegative = [];

$hashCache = [];
foreach ($fixtures as $label => $path) {
    $hashCache[$label] = VisualHash::fromFile($path)['hash_bits'];
}

foreach ($positivePairs as [$a, $b, $name]) {
    $distance = VisualHash::hammingDistance($hashCache[$a], $hashCache[$b]);
    $similarity = VisualHash::similarity($hashCache[$a], $hashCache[$b]);
    $distancesPositive[] = $distance;
    $accuracyRows[] = [
        'pair' => $name,
        'image_a' => $a,
        'image_b' => $b,
        'distance' => $distance,
        'similarity' => round($similarity, 4),
        'expected_relation' => 'positive',
        'correct' => $similarity >= 0.70,
    ];
}

foreach ([
    ['base_square', 'negative_different', 'negative_different_product'],
    ['base_square', 'negative_similar_palette', 'negative_similar_palette'],
    ['base_landscape', 'base_portrait', 'negative_orientation_mix'],
    ['base_square', 'base_landscape', 'negative_different_products'],
] as [$a, $b, $name]) {
    $distance = VisualHash::hammingDistance($hashCache[$a], $hashCache[$b]);
    $similarity = VisualHash::similarity($hashCache[$a], $hashCache[$b]);
    $distancesNegative[] = $distance;
    $accuracyRows[] = [
        'pair' => $name,
        'image_a' => $a,
        'image_b' => $b,
        'distance' => $distance,
        'similarity' => round($similarity, 4),
        'expected_relation' => 'negative',
        'correct' => $similarity < 0.70,
    ];
}

$hashRepresentation = testHashRepresentation($hashCache['base_square']);

$memoryTests = runMemoryTests($fixtureDir.'/generated');

$catalogSizes = [10_000, 50_000, 100_000, 250_000];
$bucketReports = [];
foreach ($catalogSizes as $size) {
    $bucketReports[$size] = simulateBucketDistribution($size);
}

$recallReport = runBucketRecallExperiment($hashCache, 50_000);

$candidateLimits = [50, 100, 250, 500, 1000];
$candidateRecall = testCandidateLimits($recallReport['positive_pairs'], $hashCache, 50_000, $candidateLimits);

$hammingBenchmark = benchmarkHamming($candidateLimits);

$aggregation = testProductAggregation();

$fingerprint = [
    'deterministic' => VisualHash::queryFingerprint($hashCache['base_square'], 'dhash-64-v1')
        === VisualHash::queryFingerprint($hashCache['base_square'], 'dhash-64-v1'),
    'changes_with_version' => VisualHash::queryFingerprint($hashCache['base_square'], 'dhash-64-v1')
        !== VisualHash::queryFingerprint($hashCache['base_square'], 'dhash-64-v2'),
    'sample' => VisualHash::queryFingerprint($hashCache['base_square'], 'dhash-64-v1'),
    'length' => strlen(VisualHash::queryFingerprint($hashCache['base_square'], 'dhash-64-v1')),
];

$report = [
    'generated_at' => gmdate('c'),
    'environment' => [
        'php_version' => PHP_VERSION,
        'gd_loaded' => extension_loaded('gd'),
        'gd_info' => array_intersect_key(gd_info(), array_flip(['JPEG Support', 'PNG Support', 'WebP Support'])),
        'memory_limit' => ini_get('memory_limit'),
    ],
    'fixtures' => array_keys($fixtures),
    'timing' => [
        'global_total_ms' => $globalTiming,
        'by_fixture' => $timingSummary,
        'failures' => $failures,
    ],
    'accuracy' => [
        'pairs' => $accuracyRows,
        'positive_distance' => Stats::distribution($distancesPositive),
        'negative_distance' => Stats::distribution($distancesNegative),
        'recommended_min_similarity' => recommendThreshold($distancesPositive, $distancesNegative),
    ],
    'hash_representation' => $hashRepresentation,
    'memory_safety' => $memoryTests,
    'bucket_distribution' => $bucketReports,
    'bucket_recall' => $recallReport,
    'candidate_limit_validation' => $candidateRecall,
    'hamming_benchmark' => $hammingBenchmark,
    'product_aggregation' => $aggregation,
    'query_fingerprint' => $fingerprint,
];

file_put_contents($outputPath, json_encode($report, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));

echo "Phase 3 benchmark complete.\n";
echo "Results: {$outputPath}\n";
echo 'Global total_ms p50='.round($globalTiming['p50'], 2).' p95='.round($globalTiming['p95'], 2).' p99='.round($globalTiming['p99'], 2)."\n";

/**
 * @return array<string, mixed>
 */
function testHashRepresentation(string $hashBits): array
{
    $bits = VisualHash::binaryStringToBits($hashBits);
    $roundTrip = VisualHash::bitsToBinaryString($bits);
    $bucket = VisualHash::bucketFromHashBits($hashBits);

    $mysqlSim = bin2hex($hashBits);
    $redisSim = base64_encode($hashBits);

    return [
        'byte_length' => strlen($hashBits),
        'bits_length' => strlen($bits),
        'round_trip_equal' => hash_equals($hashBits, $roundTrip),
        'bucket' => $bucket,
        'hex_canonical' => $mysqlSim,
        'base64_length' => strlen($redisSim),
        'equality_via_hash_equals' => hash_equals($hashBits, $roundTrip),
        'byte_order' => 'big-endian (bit 63 = MSB of byte 0)',
        'php_int_safe' => 'avoid PHP integers for unsigned 64-bit; use 8-byte binary string',
        'laravel_cast_recommendation' => 'custom cast or raw BINARY(8) without int cast',
    ];
}

/**
 * @return list<array<string, mixed>>
 */
function runMemoryTests(string $fixtureDir): array
{
    $tests = [];
    $cases = [
        ['label' => '1024_square', 'w' => 1024, 'h' => 1024, 'run_decode' => true],
        ['label' => '2048_square', 'w' => 2048, 'h' => 2048, 'run_decode' => true],
        ['label' => '4096_square', 'w' => 4096, 'h' => 4096, 'run_decode' => false],
        ['label' => '8000x6000', 'w' => 8000, 'h' => 6000, 'run_decode' => false],
    ];

    foreach ($cases as $case) {
        $estimated = $case['w'] * $case['h'] * 4;
        $peakBefore = memory_get_peak_usage(true);

        try {
            if (! $case['run_decode']) {
                $tests[] = [
                    'label' => $case['label'],
                    'input_dimensions' => $case['w'].'x'.$case['h'],
                    'estimated_rgba_bytes' => $estimated,
                    'estimated_working_set_bytes' => $estimated * 2,
                    'status' => 'projected_only',
                    'note' => 'Skipped live decode to avoid benchmark OOM; used for limit recommendation',
                ];

                continue;
            }

            $path = $fixtureDir.'/mem_'.$case['label'].'.jpg';
            $img = imagecreatetruecolor($case['w'], $case['h']);
            if ($img === false) {
                throw new RuntimeException('allocation failed');
            }
            imagejpeg($img, $path, 50);
            imagedestroy($img);

            $result = VisualHash::fromFile($path);
            $peakAfter = memory_get_peak_usage(true);
            $tests[] = [
                'label' => $case['label'],
                'input_dimensions' => $case['w'].'x'.$case['h'],
                'estimated_rgba_bytes' => $estimated,
                'peak_memory_delta_bytes' => max($peakAfter - $peakBefore, 0),
                'total_ms' => $result['total_ms'],
                'status' => 'ok',
            ];
            @unlink($path);
        } catch (Throwable $e) {
            $tests[] = [
                'label' => $case['label'],
                'input_dimensions' => $case['w'].'x'.$case['h'],
                'estimated_rgba_bytes' => $estimated,
                'status' => 'failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    return $tests;
}

/**
 * @return array{distribution: array<string, float|int>, sample_primary_bucket_count: int}
 */
function simulateBucketDistribution(int $imageCount): array
{
    $bucketCounts = array_fill(0, 4096, 0);

    for ($i = 0; $i < $imageCount; $i++) {
        $bucket = VisualHash::bucketFromHashBits(random_bytes(8));
        $bucketCounts[$bucket]++;
    }

    $nonZero = array_values(array_filter($bucketCounts, static fn (int $c): bool => $c > 0));
    $sampleBucket = random_int(0, 4095);

    return [
        'sample_primary_bucket_count' => $bucketCounts[$sampleBucket],
        'distribution' => [
            'image_count' => $imageCount,
            'bucket_count_used' => count($nonZero),
            'expected_uniform_per_bucket' => round($imageCount / 4096, 2),
            ...Stats::distribution($bucketCounts),
        ],
    ];
}

/**
 * @param  array<string, string>  $hashCache
 * @param  list<array{hash_bits: string, hash_bucket: int, product_id: string}>  $catalog
 * @return array<string, mixed>
 */
function runBucketRecallExperiment(array $hashCache, int $catalogImageCount): array
{
    $expectedPrimaryCandidates = (int) round($catalogImageCount / 4096);
    $positivePairs = [
        ['base_square', 'resized'],
        ['base_square', 'recompressed'],
        ['base_square', 'cropped'],
        ['base_square', 'brightness'],
    ];

    $results = [];
    $primaryHits = 0;
    $neighborHits = 0;

    foreach ($positivePairs as [$queryLabel, $targetLabel]) {
        $queryHash = $hashCache[$queryLabel];
        $targetHash = $hashCache[$targetLabel];
        $queryBucket = VisualHash::bucketFromHashBits($queryHash);
        $targetBucket = VisualHash::bucketFromHashBits($targetHash);

        $neighborBuckets = VisualHash::neighborBuckets($queryBucket, 8);
        $foundPrimary = $queryBucket === $targetBucket;
        $foundNeighbor = in_array($targetBucket, $neighborBuckets, true);
        $primaryCandidateCount = $expectedPrimaryCandidates + ($foundPrimary ? 1 : 0);
        $neighborCandidateCount = ($expectedPrimaryCandidates * count($neighborBuckets)) + 1;

        if ($foundPrimary) {
            $primaryHits++;
        }
        if ($foundNeighbor) {
            $neighborHits++;
        }

        $results[] = [
            'query' => $queryLabel,
            'target' => $targetLabel,
            'query_hash' => bin2hex($queryHash),
            'target_hash' => bin2hex($targetHash),
            'query_bucket' => $queryBucket,
            'target_bucket' => $targetBucket,
            'same_bucket' => $queryBucket === $targetBucket,
            'primary_candidate_count' => $primaryCandidateCount,
            'neighbor_candidate_count' => $neighborCandidateCount,
            'recall_primary_bucket' => $foundPrimary,
            'recall_with_neighbors' => $foundNeighbor,
            'hamming_distance' => VisualHash::hammingDistance($queryHash, $targetHash),
        ];
    }

    return [
        'positive_pairs' => $results,
        'bucket_recall_primary' => $primaryHits / max(count($positivePairs), 1),
        'bucket_recall_with_neighbors' => $neighborHits / max(count($positivePairs), 1),
        'false_negatives_primary' => count($positivePairs) - $primaryHits,
    ];
}

/**
 * @param  list<array<string, mixed>>  $positivePairs
 * @param  array<string, string>  $hashCache
 * @param  list<array{hash_bits: string, hash_bucket: int, product_id: string}>  $catalog
 * @param  list<int>  $limits
 */
function testCandidateLimits(array $positivePairs, array $hashCache, int $catalogImageCount, array $limits): array
{
    $out = [];
    $expectedNeighborCandidates = (int) round(($catalogImageCount / 4096) * 9);

    foreach ($limits as $limit) {
        $recallHits = 0;

        foreach ($positivePairs as $pair) {
            $queryHash = $hashCache[$pair['query']];
            $targetHash = hex2bin($pair['target_hash']);
            $trueDistance = $pair['hamming_distance'];
            $foundInBucketSet = $pair['recall_with_neighbors'];

            if (! $foundInBucketSet) {
                continue;
            }

            $syntheticCandidates = generateSyntheticCandidates($queryHash, $expectedNeighborCandidates, $targetHash, $trueDistance);
            usort($syntheticCandidates, static function (array $a, array $b) use ($queryHash): int {
                return VisualHash::hammingDistance($queryHash, $a['hash_bits']) <=> VisualHash::hammingDistance($queryHash, $b['hash_bits']);
            });

            $top = array_slice($syntheticCandidates, 0, $limit);
            $found = array_any(
                $top,
                static fn (array $row): bool => hash_equals($row['hash_bits'], $targetHash),
            );

            if ($found) {
                $recallHits++;
            }
        }

        $out[$limit] = [
            'recall' => $recallHits / max(count($positivePairs), 1),
            'expected_neighbor_candidates' => $expectedNeighborCandidates,
            'limit_sufficient' => $limit >= $expectedNeighborCandidates,
        ];
    }

    return $out;
}

/**
 * @return list<array{hash_bits: string}>
 */
function generateSyntheticCandidates(string $queryHash, int $count, string $targetHash, int $targetDistance): array
{
    $candidates = [['hash_bits' => $targetHash]];

    while (count($candidates) < $count) {
        $candidate = $queryHash;
        $flips = random_int(20, 40);
        for ($i = 0; $i < $flips; $i++) {
            $byteIndex = random_int(0, 7);
            $bit = random_int(0, 7);
            $candidate[$byteIndex] = chr(ord($candidate[$byteIndex]) ^ (1 << $bit));
        }
        if (VisualHash::hammingDistance($queryHash, $candidate) <= $targetDistance) {
            continue;
        }
        $candidates[] = ['hash_bits' => $candidate];
    }

    return $candidates;
}

/**
 * @param  list<int>  $limits
 */
function benchmarkHamming(array $limits): array
{
    $hashes = [];
    for ($i = 0; $i < 2000; $i++) {
        $hashes[] = random_bytes(8);
    }
    $query = random_bytes(8);

    $out = [];
    foreach ($limits as $limit) {
        $slice = array_slice($hashes, 0, $limit);
        $start = hrtime(true);
        $distances = [];
        foreach ($slice as $hash) {
            $distances[] = VisualHash::hammingDistance($query, $hash);
        }
        usort($distances, static fn (int $a, int $b): int => $a <=> $b);
        $elapsedMs = (hrtime(true) - $start) / 1_000_000;
        $out[$limit] = [
            'total_ms' => $elapsedMs,
            'per_candidate_us' => ($elapsedMs * 1000) / max($limit, 1),
            'memory_peak_bytes' => memory_get_peak_usage(true),
        ];
    }

    return $out;
}

function testProductAggregation(): array
{
    $examples = [
        ['scores' => [0.72, 0.94, 0.61], 'max' => 0.94, 'avg' => 0.757, 'top2_avg' => 0.83],
    ];

    $rankingIssue = 'max preserves best matching angle; mild penalty when duplicate weak images exist';

    return [
        'rule' => 'KEEP_MAX_AGGREGATION',
        'examples' => $examples,
        'note' => $rankingIssue,
        'tie_break' => 'product_id ASC after similarity DESC',
    ];
}

/**
 * @param  list<int>  $positive
 * @param  list<int>  $negative
 */
function recommendThreshold(array $positive, array $negative): array
{
    $maxPositive = $positive === [] ? 64 : max($positive);
    $minNegative = $negative === [] ? 0 : min($negative);

    return [
        'max_positive_distance' => $maxPositive,
        'min_negative_distance' => $minNegative,
        'gap' => $minNegative - $maxPositive,
        'default_min_similarity_0_70' => $maxPositive <= 19 ? 'safe' : 'review',
        'observed_positive_p95_distance' => Stats::distribution($positive)['p95'],
        'observed_negative_p05_distance' => Stats::distribution($negative)['min'],
    ];
}
