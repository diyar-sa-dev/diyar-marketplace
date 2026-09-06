<?php

declare(strict_types=1);

/**
 * Parallel HTTP vendor payout requests (full balance).
 *
 * Usage: php scripts/stage2817-http-payout-concurrency.php --base=http://127.0.0.1:8088 --fixture=path.json
 */
$base = 'http://127.0.0.1:8088';
$fixturePath = '';

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--base=')) {
        $base = rtrim(substr($arg, 7), '/');
    }
    if (str_starts_with($arg, '--fixture=')) {
        $fixturePath = substr($arg, 10);
    }
}

if ($fixturePath === '' || ! is_readable($fixturePath)) {
    fwrite(STDERR, "usage: --fixture=path.json\n");
    exit(2);
}

/** @var array{vendor: array{identifier: string, password: string}, amount: string} $fixture */
$fixture = json_decode(file_get_contents($fixturePath), true, 512, JSON_THROW_ON_ERROR);

function req(string $url, string $jar, array $headers = [], ?string $body = null, string $method = 'GET'): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_COOKIEJAR => $jar,
        CURLOPT_COOKIEFILE => $jar,
        CURLOPT_HTTPHEADER => array_merge(['Accept: application/json', 'Origin: http://localhost:3000'], $headers),
        CURLOPT_CUSTOMREQUEST => $method,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    $response = (string) curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['code' => $code, 'body' => $response];
}

function xsrf(string $jar): ?string
{
    foreach (file($jar, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
        if (str_contains($line, 'XSRF-TOKEN') && ! str_starts_with(trim($line), '#')) {
            $parts = preg_split('/\s+/', trim($line));

            return isset($parts[6]) ? urldecode($parts[6]) : null;
        }
    }

    return null;
}

function sessionForVendor(string $base, array $vendor): array
{
    $jar = sys_get_temp_dir().DIRECTORY_SEPARATOR.'diyar_po_'.bin2hex(random_bytes(4)).'.cookies';
    req($base.'/sanctum/csrf-cookie', $jar);
    $login = req(
        $base.'/api/v1/auth/login',
        $jar,
        ['Content-Type: application/json', 'Referer: http://localhost:3000', 'X-XSRF-TOKEN: '.(xsrf($jar) ?? '')],
        json_encode(['method' => 'phone', 'identifier' => $vendor['identifier'], 'password' => $vendor['password']], JSON_THROW_ON_ERROR),
        'POST',
    );
    if ($login['code'] !== 200) {
        throw new RuntimeException('Vendor login failed: '.$login['body']);
    }

    req($base.'/sanctum/csrf-cookie', $jar);

    return ['jar' => $jar, 'xsrf' => xsrf($jar)];
}

echo "=== HTTP payout concurrency ===\nbase={$base}\n";

$sessions = [];
for ($i = 0; $i < 4; $i++) {
    $sessions[] = sessionForVendor($base, $fixture['vendor']);
}

$payload = json_encode(['amount' => $fixture['amount']], JSON_THROW_ON_ERROR);
$multi = curl_multi_init();
$handles = [];

foreach ($sessions as $idx => $session) {
    $ch = curl_init($base.'/api/v1/dashboard/vendor/finance/payouts');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_COOKIEJAR => $session['jar'],
        CURLOPT_COOKIEFILE => $session['jar'],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Content-Type: application/json',
            'Origin: http://localhost:3000',
            'Referer: http://localhost:3000',
            'X-XSRF-TOKEN: '.($session['xsrf'] ?? ''),
        ],
    ]);
    curl_multi_add_handle($multi, $ch);
    $handles[] = ['ch' => $ch, 'idx' => $idx];
}

do {
    curl_multi_exec($multi, $running);
    curl_multi_select($multi, 1.0);
} while ($running > 0);

$created = 0;
$rejected = 0;
foreach ($handles as $handle) {
    $code = (int) curl_getinfo($handle['ch'], CURLINFO_HTTP_CODE);
    $body = (string) curl_multi_getcontent($handle['ch']);
    echo "worker={$handle['idx']} HTTP {$code} ".substr($body, 0, 100)."\n";
    if (in_array($code, [201, 200], true)) {
        $created++;
    } else {
        $rejected++;
    }
    curl_multi_remove_handle($multi, $handle['ch']);
    curl_close($handle['ch']);
}
curl_multi_close($multi);

$pass = $created === 1 && $rejected === 3;
echo "created={$created} rejected={$rejected}\n";
echo $pass ? "RESULT: PASS\n" : "RESULT: FAIL\n";
exit($pass ? 0 : 1);
