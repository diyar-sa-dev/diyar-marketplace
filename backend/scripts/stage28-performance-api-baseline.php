<?php

declare(strict_types=1);

/**
 * Stage 28.7 — Single-request API latency + optional query log via artisan serve simulation.
 * For production-representative numbers, run against Octane+MySQL8 stack.
 *
 * Usage: php scripts/stage28-performance-api-baseline.php [--base-url=http://127.0.0.1:8000] [--iterations=5]
 */

require __DIR__.'/../vendor/autoload.php';

$baseUrl = 'http://127.0.0.1:8000/api/v1';
$iterations = 5;
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--base-url=')) {
        $baseUrl = rtrim(substr($arg, 11), '/').'/api/v1';
    }
    if (str_starts_with($arg, '--iterations=')) {
        $iterations = max(1, (int) substr($arg, 13));
    }
}

$endpoints = [
    ['GET', '/health', 'public'],
    ['GET', '/products?per_page=12', 'catalog'],
    ['GET', '/catalog/search?q=%D9%83%D9%86%D8%A8&type=products&per_page=12', 'catalog'],
    ['GET', '/categories', 'catalog'],
    ['GET', '/services?per_page=12', 'services'],
    ['GET', '/vendors', 'catalog'],
];

function requestStats(string $method, string $url, int $iterations): array
{
    $samples = [];
    $statuses = [];
    $sizes = [];
    for ($i = 0; $i < $iterations; $i++) {
        $start = microtime(true);
        $ctx = stream_context_create([
            'http' => [
                'method' => $method,
                'timeout' => 60,
                'ignore_errors' => true,
                'header' => "Accept: application/json\r\nX-Forwarded-For: 10.0.0.".($i + 1)."\r\n",
            ],
        ]);
        $body = @file_get_contents($url, false, $ctx);
        $ms = (microtime(true) - $start) * 1000;
        $samples[] = $ms;
        $status = 0;
        if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
            $status = (int) $m[1];
        }
        $statuses[] = $status;
        $sizes[] = $body !== false ? strlen($body) : 0;
        usleep(50000);
    }

    sort($samples);
    $n = count($samples);
    $p50 = $samples[(int) floor(($n - 1) * 0.5)];
    $p95 = $samples[(int) floor(($n - 1) * 0.95)];
    $p99 = $samples[(int) floor(($n - 1) * 0.99)];

    return [
        'iterations' => $iterations,
        'min_ms' => round(min($samples), 2),
        'p50_ms' => round($p50, 2),
        'p95_ms' => round($p95, 2),
        'p99_ms' => round($p99, 2),
        'max_ms' => round(max($samples), 2),
        'avg_ms' => round(array_sum($samples) / $n, 2),
        'status_codes' => array_count_values($statuses),
        'avg_payload_bytes' => (int) round(array_sum($sizes) / max(1, count($sizes))),
    ];
}

$result = [
    'timestamp_utc' => gmdate('c'),
    'base_url' => $baseUrl,
    'iterations_per_endpoint' => $iterations,
    'endpoints' => [],
];

foreach ($endpoints as [$method, $path, $group]) {
    $result['endpoints'][$path] = array_merge(
        ['method' => $method, 'group' => $group],
        requestStats($method, $baseUrl.$path, $iterations)
    );
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
