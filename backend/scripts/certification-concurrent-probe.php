<?php

declare(strict_types=1);

/**
 * Lightweight concurrent HTTP probe (no k6 required).
 * Usage: php scripts/certification-concurrent-probe.php [--url=...] [--concurrency=50]
 */

$url = 'http://127.0.0.1:8000/api/v1/products?per_page=12';
$concurrency = 50;
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--url=')) {
        $url = substr($arg, 6);
    }
    if (str_starts_with($arg, '--concurrency=')) {
        $concurrency = max(1, (int) substr($arg, 14));
    }
}

$mh = curl_multi_init();
$handles = [];
for ($i = 0; $i < $concurrency; $i++) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_HTTPHEADER => ['Accept: application/json', 'X-Forwarded-For: 10.0.0.'.($i + 1)],
    ]);
    curl_multi_add_handle($mh, $ch);
    $handles[] = $ch;
}

$running = null;
do {
    curl_multi_exec($mh, $running);
    curl_multi_select($mh, 1.0);
} while ($running > 0);

$samples = [];
$ok = 0;
foreach ($handles as $ch) {
    $info = curl_getinfo($ch);
    $ms = ($info['total_time'] ?? 0) * 1000;
    $samples[] = $ms;
    if (($info['http_code'] ?? 0) === 200) {
        $ok++;
    }
    curl_multi_remove_handle($mh, $ch);
    curl_close($ch);
}
curl_multi_close($mh);

sort($samples);
$n = count($samples);
$p50 = $samples[(int) floor(($n - 1) * 0.5)] ?? 0;
$p95 = $samples[(int) floor(($n - 1) * 0.95)] ?? 0;
$p99 = $samples[(int) floor(($n - 1) * 0.99)] ?? 0;

echo json_encode([
    'timestamp_utc' => gmdate('c'),
    'url' => $url,
    'concurrency' => $concurrency,
    'success' => $ok,
    'errors' => $concurrency - $ok,
    'min_ms' => round(min($samples), 2),
    'p50_ms' => round($p50, 2),
    'p95_ms' => round($p95, 2),
    'p99_ms' => round($p99, 2),
    'max_ms' => round(max($samples), 2),
    'avg_ms' => round(array_sum($samples) / max(1, $n), 2),
    'note' => 'Single-process php artisan serve — NOT production FPM. Measures concurrent client wait time only.',
], JSON_PRETTY_PRINT).PHP_EOL;
