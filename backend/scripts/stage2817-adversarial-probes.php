<?php

declare(strict_types=1);

/**
 * Adversarial infrastructure probes — Redis/MySQL failure, proxy IP spoofing, readiness.
 *
 * Usage:
 *   php scripts/stage2817-adversarial-probes.php --base=http://127.0.0.1:8093
 */

$base = 'http://127.0.0.1:8093';

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--base=')) {
        $base = rtrim(substr($arg, 7), '/');
    }
}

function httpProbe(string $url, array $headers = [], int $timeout = 10): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => $timeout,
    ]);
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['code' => $code, 'raw' => (string) $raw];
}

$results = [];

// 1. Live vs ready distinction
$live = httpProbe($base.'/api/v1/health/live');
$ready = httpProbe($base.'/api/v1/health/ready');
$results['health_live'] = ['code' => $live['code'], 'pass' => $live['code'] === 200];
$results['health_ready'] = ['code' => $ready['code'], 'pass' => $ready['code'] === 200];

// 2. Rotating spoofed X-Forwarded-For must NOT bypass rate limits (untrusted direct client)
$got429 = false;
for ($i = 0; $i < 70; $i++) {
    $fakeIp = '203.0.113.'.($i % 250 + 1);
    $r = httpProbe($base.'/api/v1/catalog/search?q=adversarial-probe-'.$i.'&type=products', [
        'Accept: application/json',
        'X-Forwarded-For: '.$fakeIp,
        'X-Real-IP: '.$fakeIp,
    ]);
    if ($r['code'] === 429) {
        $got429 = true;
        break;
    }
}
$results['xff_spoof_rate_limit'] = [
    'pass' => $got429,
    'note' => 'Rotating spoofed XFF must not bypass catalog-search limiter',
];

// 3. Production must not leak stack traces on 500
$bad = httpProbe($base.'/api/v1/this-route-does-not-exist-xyz');
$body = $bad['raw'];
$leaks = str_contains($body, 'vendor/laravel') || str_contains($body, 'Stack trace');
$results['error_no_stack_trace'] = ['code' => $bad['code'], 'pass' => $bad['code'] === 404 && ! $leaks];

// 4. Redis failure simulation (stop redis container externally before --redis-down)
$redisDown = in_array('--redis-down', $argv, true);
if ($redisDown) {
    $rd = httpProbe($base.'/api/v1/health/ready');
    $results['redis_down_ready'] = [
        'code' => $rd['code'],
        'pass' => $rd['code'] >= 500 || $rd['code'] === 503,
        'note' => 'Readiness should fail when Redis unavailable',
    ];
}

$allPass = true;
foreach ($results as $name => $row) {
    $ok = $row['pass'] ?? false;
    echo sprintf("%s: %s\n", $name, $ok ? 'PASS' : 'FAIL');
    if (! $ok) {
        $allPass = false;
    }
}

$out = ['tool' => 'adversarial-probes', 'base' => $base, 'result' => $allPass ? 'passed' : 'failed', 'checks' => $results];
$rawDir = dirname(__DIR__, 2).'/conception/Stages/Stage 28/Phase 28.17 - Enterprise Concurrency & Octane Hardening/_raw';
if (is_dir($rawDir)) {
    file_put_contents($rawDir.'/adversarial-probes-'.date('Ymd-His').'.json', json_encode($out, JSON_PRETTY_PRINT));
}

exit($allPass ? 0 : 1);
