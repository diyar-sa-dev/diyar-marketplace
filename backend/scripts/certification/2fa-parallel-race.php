<?php

declare(strict_types=1);

/**
 * Parallel 2FA verify race probe (curl_multi).
 * Usage: php scripts/certification/2fa-parallel-race.php <challenge_id> <otp> [concurrency]
 */

$challenge = $argv[1] ?? null;
$otp = $argv[2] ?? null;
$parallel = max(1, (int) ($argv[3] ?? 8));
$baseUrl = $argv[4] ?? 'http://127.0.0.1:8093/api/v1';
$origin = 'http://localhost:3000';

if (! is_string($challenge) || $challenge === '' || ! is_string($otp) || $otp === '') {
    fwrite(STDERR, "Usage: php 2fa-parallel-race.php <challenge_id> <otp> [concurrency] [base_url]\n");
    exit(2);
}

$jar = sys_get_temp_dir().'/diyar-parallel-race-'.getmypid().'.jar';
@unlink($jar);
$xsrf = null;

$bootstrap = function (string $method, string $url, ?string $body = null) use (&$jar, &$xsrf, $origin): void {
    $headers = [
        'Accept: application/json',
        'Origin: '.$origin,
        'Referer: '.$origin.'/',
    ];
    if ($xsrf !== null) {
        $headers[] = 'X-XSRF-TOKEN: '.$xsrf;
    }
    if ($body !== null) {
        $headers[] = 'Content-Type: application/json';
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_COOKIEJAR => $jar,
        CURLOPT_COOKIEFILE => $jar,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => $body,
    ]);
    $raw = curl_exec($ch);
    $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);

    $headerText = substr((string) $raw, 0, $headerSize);
    if (preg_match('/Set-Cookie:\s*XSRF-TOKEN=([^;]+)/i', $headerText, $m)) {
        $xsrf = urldecode($m[1]);
    }
    if ($xsrf === null && is_readable($jar)) {
        foreach (file($jar) as $line) {
            if (preg_match('/\sXSRF-TOKEN\s+(\S+)/', $line, $m)) {
                $xsrf = urldecode($m[1]);
            }
        }
    }
};

$root = preg_replace('#/api/v1$#', '', $baseUrl) ?: $baseUrl;
$bootstrap('GET', $root.'/sanctum/csrf-cookie');

$mh = curl_multi_init();
$handles = [];
$payload = json_encode(['challenge_id' => $challenge, 'code' => $otp], JSON_THROW_ON_ERROR);

for ($i = 0; $i < $parallel; $i++) {
    $ch = curl_init(rtrim($baseUrl, '/').'/auth/verify-two-factor');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_COOKIEFILE => $jar,
        CURLOPT_COOKIEJAR => $jar,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Content-Type: application/json',
            'Origin: '.$origin,
            'Referer: '.$origin.'/',
            'X-XSRF-TOKEN: '.($xsrf ?? ''),
        ],
    ]);
    curl_multi_add_handle($mh, $ch);
    $handles[] = $ch;
}

$running = null;
do {
    curl_multi_exec($mh, $running);
    curl_multi_select($mh, 1.0);
} while ($running > 0);

$successes = 0;
$statuses = [];
$latencies = [];
foreach ($handles as $ch) {
    $start = curl_getinfo($ch, CURLINFO_TOTAL_TIME);
    $body = curl_multi_getcontent($ch);
    $info = curl_getinfo($ch);
    $statuses[] = (int) ($info['http_code'] ?? 0);
    $latencies[] = ($info['total_time'] ?? 0) * 1000;
    if (($info['http_code'] ?? 0) === 200) {
        $successes++;
    }
    curl_multi_remove_handle($mh, $ch);
    curl_close($ch);
}
curl_multi_close($mh);

sort($latencies);
$n = count($latencies);
$p50 = $latencies[(int) floor(($n - 1) * 0.5)] ?? 0;
$p95 = $latencies[(int) floor(($n - 1) * 0.95)] ?? 0;

$result = [
    'timestamp_utc' => gmdate('c'),
    'concurrency' => $parallel,
    'successes' => $successes,
    'failures' => $parallel - $successes,
    'statuses' => $statuses,
    'p50_ms' => round($p50, 2),
    'p95_ms' => round($p95, 2),
    'pass' => $successes === 1,
];

echo json_encode($result, JSON_PRETTY_PRINT).PHP_EOL;
exit($successes === 1 ? 0 : 1);
