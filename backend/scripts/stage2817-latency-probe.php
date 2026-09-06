<?php

declare(strict_types=1);

/**
 * Controlled latency probe for representative API endpoints.
 *
 * Usage:
 *   php scripts/stage2817-latency-probe.php --base=http://127.0.0.1:8088 --label=octane-multinode --iterations=20
 */
$base = 'http://127.0.0.1:8088';
$label = 'runtime';
$iterations = 20;

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--base=')) {
        $base = rtrim(substr($arg, 7), '/');
    }
    if (str_starts_with($arg, '--label=')) {
        $label = substr($arg, 8);
    }
    if (str_starts_with($arg, '--iterations=')) {
        $iterations = max(1, (int) substr($arg, 13));
    }
}

$endpoints = [
    'health' => '/api/v1/health',
    'categories' => '/api/v1/categories',
    'catalog_search' => '/api/v1/catalog/search?q=bed',
    'products' => '/api/v1/products?per_page=12',
];

function probe(string $url): int
{
    $start = hrtime(true);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
        CURLOPT_TIMEOUT => 30,
    ]);
    curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $ms = (int) round((hrtime(true) - $start) / 1_000_000);

    return $code >= 200 && $code < 500 ? $ms : -1;
}

function percentile(array $values, float $p): int
{
    sort($values);
    $index = (int) floor(($p / 100) * (count($values) - 1));

    return $values[$index] ?? 0;
}

echo "=== Latency probe: {$label} ===\n";
echo "base={$base} iterations={$iterations}\n";

foreach ($endpoints as $name => $path) {
    $samples = [];
    for ($i = 0; $i < $iterations; $i++) {
        $ms = probe($base.$path);
        if ($ms >= 0) {
            $samples[] = $ms;
        }
    }

    if ($samples === []) {
        echo "{$name}: FAILED\n";

        continue;
    }

    $avg = (int) round(array_sum($samples) / count($samples));
    echo sprintf(
        "%s: n=%d avg=%dms p50=%dms p95=%dms p99=%dms min=%dms max=%dms\n",
        $name,
        count($samples),
        $avg,
        percentile($samples, 50),
        percentile($samples, 95),
        percentile($samples, 99),
        min($samples),
        max($samples),
    );
}
