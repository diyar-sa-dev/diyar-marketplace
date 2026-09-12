<?php

declare(strict_types=1);

require __DIR__.'/lib/VisualHash.php';

$fixtureDir = sys_get_temp_dir().'/diyar-visual-search-benchmark/fixtures/generated';
require __DIR__.'/lib/FixtureGenerator.php';

if (! is_file($fixtureDir.'/base_square.jpg')) {
    FixtureGenerator::ensureDirectory($fixtureDir);
    FixtureGenerator::generateAll(dirname($fixtureDir));
}

$pairs = [
    ['base_square', 'resized'],
    ['base_square', 'recompressed'],
    ['base_square', 'cropped'],
    ['base_square', 'brightness'],
    ['base_square', 'format_png', 'format.png'],
    ['base_square', 'format_webp', 'format.webp'],
];

function prefixBuckets(int $radius): array
{
    return [];
}

function bucketsWithinHamming(int $bucket, int $radius): array
{
    $buckets = [];
    for ($candidate = 0; $candidate <= 0xFFF; $candidate++) {
        $xor = $bucket ^ $candidate;
        $distance = 0;
        for ($bit = 0; $bit < 12; $bit++) {
            if (($xor & (1 << (11 - $bit))) !== 0) {
                $distance++;
            }
        }
        if ($distance <= $radius) {
            $buckets[] = $candidate;
        }
    }

    return $buckets;
}

$results = [];
foreach ($pairs as $pair) {
    $a = $pair[0];
    $b = $pair[1];
    $bFile = $pair[2] ?? null;
    $ha = VisualHash::fromFile(resolveFixture($fixtureDir, $a))['hash_bits'];
    $hb = VisualHash::fromFile($bFile ? $fixtureDir.'/'.$bFile : resolveFixture($fixtureDir, $b))['hash_bits'];
    $ba = VisualHash::bucketFromHashBits($ha);
    $bb = VisualHash::bucketFromHashBits($hb);
    $fullDistance = VisualHash::hammingDistance($ha, $hb);

    $prefixDistance = 0;
    for ($bit = 0; $bit < 12; $bit++) {
        $mask = 1 << (11 - $bit);
        if (($ba & $mask) !== ($bb & $mask)) {
            $prefixDistance++;
        }
    }

    $radiusRecall = [];
    foreach ([0, 1, 2, 3, 4] as $radius) {
        $set = bucketsWithinHamming($ba, $radius);
        $radiusRecall[$radius] = [
            'bucket_count' => count($set),
            'recall' => in_array($bb, $set, true),
        ];
    }

    $results[] = [
        'pair' => $a.' -> '.$b,
        'full_hamming' => $fullDistance,
        'prefix_hamming_12' => $prefixDistance,
        'query_bucket' => $ba,
        'target_bucket' => $bb,
        'radius_recall' => $radiusRecall,
    ];
}

echo json_encode($results, JSON_PRETTY_PRINT).PHP_EOL;

function resolveFixture(string $dir, string $label): string
{
    foreach (['jpg', 'jpeg', 'png', 'webp'] as $ext) {
        $path = $dir.'/'.$label.'.'.$ext;
        if (is_file($path)) {
            return $path;
        }
    }

    throw new RuntimeException('Missing fixture: '.$label);
}
