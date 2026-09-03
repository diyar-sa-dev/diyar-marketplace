<?php

declare(strict_types=1);

/**
 * Warm FPM vs Octane benchmark — identical endpoints/workloads.
 *
 * Usage:
 *   php scripts/stage2817-fpm-octane-benchmark.php --fpm=http://127.0.0.1:8092 --octane=http://127.0.0.1:8088
 */

$fpm = 'http://127.0.0.1:8092';
$octane = 'http://127.0.0.1:8088';
$duration = 15;

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--fpm=')) {
        $fpm = rtrim(substr($arg, 6), '/');
    }
    if (str_starts_with($arg, '--octane=')) {
        $octane = rtrim(substr($arg, 9), '/');
    }
    if (str_starts_with($arg, '--duration=')) {
        $duration = max(5, (int) substr($arg, 11));
    }
}

$endpoints = [
    ['name' => 'health', 'path' => '/api/v1/health', 'concurrency' => 50],
    ['name' => 'categories', 'path' => '/api/v1/categories', 'concurrency' => 25],
    ['name' => 'products', 'path' => '/api/v1/products?per_page=12', 'concurrency' => 15],
];

function warm(string $base, array $paths): void
{
    foreach ($paths as $path) {
        for ($i = 0; $i < 10; $i++) {
            $ch = curl_init($base.$path);
            curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30]);
            curl_exec($ch);
            curl_close($ch);
        }
    }
}

function runLoad(string $url, int $concurrency, int $durationSec): array
{
    $latencies = [];
    $errors = 0;
    $status5xx = 0;
    $completed = 0;
    $deadline = microtime(true) + $durationSec;

    while (microtime(true) < $deadline) {
        $multi = curl_multi_init();
        $handles = [];
        for ($i = 0; $i < $concurrency; $i++) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => ['Accept: application/json'],
                CURLOPT_TIMEOUT => 30,
            ]);
            curl_multi_add_handle($multi, $ch);
            $handles[] = ['ch' => $ch, 'start' => hrtime(true)];
        }
        do {
            $status = curl_multi_exec($multi, $running);
            curl_multi_select($multi, 0.5);
        } while ($running > 0 && $status === CURLM_OK);

        foreach ($handles as $handle) {
            $code = (int) curl_getinfo($handle['ch'], CURLINFO_HTTP_CODE);
            $ms = (int) round((hrtime(true) - $handle['start']) / 1_000_000);
            $completed++;
            if ($code >= 500) {
                $status5xx++;
                $errors++;
            } elseif ($code < 200 || $code >= 300) {
                $errors++;
            } else {
                $latencies[] = $ms;
            }
            curl_multi_remove_handle($multi, $handle['ch']);
            curl_close($handle['ch']);
        }
        curl_multi_close($multi);
    }

    sort($latencies);
    $p = static fn (array $v, float $pct): int => $v === [] ? 0 : $v[(int) floor(($pct / 100) * (count($v) - 1))];

    return [
        'rps' => $durationSec > 0 ? round($completed / $durationSec, 2) : 0,
        'p50' => $p($latencies, 50),
        'p95' => $p($latencies, 95),
        'p99' => $p($latencies, 99),
        'max' => $latencies !== [] ? max($latencies) : 0,
        'errors' => $errors,
        'status5xx' => $status5xx,
        'samples' => count($latencies),
    ];
}

echo "=== FPM vs Octane benchmark (warm, {$duration}s windows) ===\n";

$paths = array_column($endpoints, 'path');
warm($fpm, $paths);
warm($octane, $paths);

$results = [];

foreach ($endpoints as $ep) {
    echo "\n--- {$ep['name']} concurrency={$ep['concurrency']} ---\n";
    foreach (['FPM' => $fpm, 'Octane' => $octane] as $label => $base) {
        $url = $base.$ep['path'];
        $r = runLoad($url, $ep['concurrency'], $duration);
        $results[$ep['name']][$label] = $r;
        echo sprintf(
            "%s: rps=%.1f p50=%d p95=%d p99=%d max=%d 5xx=%d errors=%d samples=%d\n",
            $label,
            $r['rps'],
            $r['p50'],
            $r['p95'],
            $r['p99'],
            $r['max'],
            $r['status5xx'],
            $r['errors'],
            $r['samples'],
        );
    }
}

$out = dirname(__DIR__).'/../conception/Stages/Stage 28/Phase 28.17 - Enterprise Concurrency & Octane Hardening/_raw/fpm-octane-benchmark-'.date('Ymd-His').'.json';
file_put_contents($out, json_encode(['duration' => $duration, 'results' => $results], JSON_PRETTY_PRINT));
echo "\nWrote {$out}\n";
