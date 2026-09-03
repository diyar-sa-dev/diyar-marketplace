<?php

declare(strict_types=1);

/**
 * Rate limit probe — verify HTTP 429 after threshold.
 *
 * Usage:
 *   php scripts/stage2817-rate-limit-probe.php --base=http://127.0.0.1:8088
 *   php scripts/stage2817-rate-limit-probe.php --base=http://127.0.0.1:8088 --endpoint=search
 *   php scripts/stage2817-rate-limit-probe.php --base=http://127.0.0.1:8088 --endpoint=auth
 */

$base = 'http://127.0.0.1:8088';
$endpoint = 'search';

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--base=')) {
        $base = rtrim(substr($arg, 7), '/');
    }
    if (str_starts_with($arg, '--endpoint=')) {
        $endpoint = substr($arg, 11);
    }
}

function probeSearch(string $base): bool
{
    $url = $base.'/api/v1/catalog/search?q=rate-limit-probe&type=products';
    $got429 = false;
    $lastCode = 0;

    echo "=== Rate limit probe (catalog search) ===\n";

    for ($i = 1; $i <= 120; $i++) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
        ]);
        curl_exec($ch);
        $lastCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($lastCode === 429) {
            $got429 = true;
            echo "429 at attempt {$i}\n";
            break;
        }
    }

    echo "last_code={$lastCode} got_429=".($got429 ? 'yes' : 'no')."\n";

    return $got429;
}

function probeAuth(string $base): bool
{
    $url = $base.'/api/v1/auth/login';
    $payload = json_encode(['method' => 'phone', 'identifier' => '999999999', 'password' => 'wrong'], JSON_THROW_ON_ERROR);
    $got429 = false;
    $lastCode = 0;
    $jar = __DIR__.'/../storage/framework/cache/rate-limit-probe.cookies';
    @unlink($jar);
    @mkdir(dirname($jar), 0777, true);
    file_put_contents($jar, "# Netscape HTTP Cookie File\n");

    $csrfReq = curl_init($base.'/sanctum/csrf-cookie');
    curl_setopt_array($csrfReq, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_COOKIEJAR => $jar,
        CURLOPT_COOKIEFILE => $jar,
    ]);
    curl_exec($csrfReq);
    $csrfCode = (int) curl_getinfo($csrfReq, CURLINFO_HTTP_CODE);
    curl_close($csrfReq);

    if ($csrfCode >= 400 || ! is_readable($jar)) {
        echo "CSRF bootstrap failed code={$csrfCode}\n";

        return false;
    }

    $xsrf = null;
    foreach (file($jar, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
        if (str_contains($line, 'XSRF-TOKEN') && ! str_starts_with(trim($line), '#')) {
            $parts = preg_split('/\s+/', trim($line));
            $xsrf = isset($parts[6]) ? urldecode($parts[6]) : null;
        }
    }

    echo "=== Rate limit probe (auth login) ===\n";

    for ($i = 1; $i <= 40; $i++) {
        if ($i % 5 === 1) {
            $csrfReq = curl_init($base.'/sanctum/csrf-cookie');
            curl_setopt_array($csrfReq, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_COOKIEJAR => $jar,
                CURLOPT_COOKIEFILE => $jar,
            ]);
            curl_exec($csrfReq);
            curl_close($csrfReq);
            $xsrf = null;
            foreach (file($jar, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
                if (str_contains($line, 'XSRF-TOKEN') && ! str_starts_with(trim($line), '#')) {
                    $parts = preg_split('/\s+/', trim($line));
                    $xsrf = isset($parts[6]) ? urldecode($parts[6]) : null;
                }
            }
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_COOKIEJAR => $jar,
            CURLOPT_COOKIEFILE => $jar,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'Content-Type: application/json',
                'Origin: http://localhost:3000',
                'Referer: http://localhost:3000',
                'X-XSRF-TOKEN: '.($xsrf ?? ''),
            ],
        ]);
        curl_exec($ch);
        $lastCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($lastCode === 429) {
            $got429 = true;
            echo "429 at attempt {$i}\n";
            break;
        }
    }

    echo "last_code={$lastCode} got_429=".($got429 ? 'yes' : 'no')."\n";

    return $got429;
}

$passed = match ($endpoint) {
    'auth' => probeAuth($base),
    default => probeSearch($base),
};

echo $passed ? "RESULT: PASS\n" : "RESULT: FAIL\n";
exit($passed ? 0 : 1);
