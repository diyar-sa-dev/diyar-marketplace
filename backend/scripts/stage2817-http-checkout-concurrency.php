<?php

declare(strict_types=1);

/**
 * Parallel HTTP checkout through nginx → Octane (stock=1).
 *
 * Usage:
 *   php scripts/stage2817-http-checkout-concurrency.php --base=http://127.0.0.1:8088 --fixture=/path/to/fixture.json
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
    fwrite(STDERR, "usage: --fixture=path/to/fixture.json\n");
    exit(2);
}

/** @var array{product_id: string, vendor_account_id: string, customers: list<array{identifier: string, password: string, address_id: string}>} $fixture */
$raw = preg_replace('/^\xEF\xBB\xBF/', '', (string) file_get_contents($fixturePath));
$fixture = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);

function req(string $url, string $jar, array $headers = [], ?string $body = null, string $method = 'GET'): array
{
    $h = array_merge(['Accept: application/json', 'Origin: http://localhost:3000'], $headers);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_COOKIEJAR => $jar,
        CURLOPT_COOKIEFILE => $jar,
        CURLOPT_HTTPHEADER => $h,
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

function prepareCustomer(string $base, array $customer, string $productId, string $vendorAccountId): array
{
    $jar = sys_get_temp_dir().DIRECTORY_SEPARATOR.'diyar_co_'.bin2hex(random_bytes(4)).'.cookies';
    req($base.'/sanctum/csrf-cookie', $jar);
    $token = xsrf($jar);

    $login = req(
        $base.'/api/v1/auth/login',
        $jar,
        ['Content-Type: application/json', 'Referer: http://localhost:3000', 'X-XSRF-TOKEN: '.($token ?? '')],
        json_encode(['method' => 'phone', 'identifier' => $customer['identifier'], 'password' => $customer['password']], JSON_THROW_ON_ERROR),
        'POST',
    );
    if ($login['code'] !== 200) {
        throw new RuntimeException('Login failed: '.$login['body']);
    }

    req(
        $base.'/api/v1/cart/items',
        $jar,
        ['Content-Type: application/json', 'Referer: http://localhost:3000', 'X-XSRF-TOKEN: '.(xsrf($jar) ?? '')],
        json_encode(['product_id' => $productId, 'quantity' => 1], JSON_THROW_ON_ERROR),
        'POST',
    );

    $payload = json_encode([
        'shipping_address_id' => $customer['address_id'],
        'vendor_delivery_selections' => [
            ['vendor_account_id' => $vendorAccountId, 'method' => 'pickup'],
        ],
    ], JSON_THROW_ON_ERROR);

    return ['jar' => $jar, 'payload' => $payload];
}

function refreshCsrf(string $base, string $jar): string
{
    req($base.'/sanctum/csrf-cookie', $jar);
    $token = xsrf($jar);

    if ($token === null || $token === '') {
        throw new RuntimeException('CSRF token unavailable after refresh.');
    }

    return $token;
}

echo "=== HTTP checkout concurrency ===\nbase={$base}\n";

$prepared = [];
foreach ($fixture['customers'] as $idx => $customer) {
    $prepared[] = prepareCustomer($base, $customer, $fixture['product_id'], $fixture['vendor_account_id']);
}

$multi = curl_multi_init();
$handles = [];

foreach ($prepared as $idx => $session) {
    $xsrf = refreshCsrf($base, $session['jar']);
    $ch = curl_init($base.'/api/v1/orders');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_COOKIEJAR => $session['jar'],
        CURLOPT_COOKIEFILE => $session['jar'],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $session['payload'],
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Content-Type: application/json',
            'Origin: http://localhost:3000',
            'Referer: http://localhost:3000',
            'X-XSRF-TOKEN: '.$xsrf,
            'Idempotency-Key: '.bin2hex(random_bytes(16)),
        ],
    ]);
    curl_multi_add_handle($multi, $ch);
    $handles[] = ['ch' => $ch, 'idx' => $idx];
}

do {
    $status = curl_multi_exec($multi, $running);
    curl_multi_select($multi, 1.0);
} while ($running > 0 && $status === CURLM_OK);

$created = 0;
$rejected = 0;
$results = [];

foreach ($handles as $handle) {
    $body = (string) curl_multi_getcontent($handle['ch']);
    $code = (int) curl_getinfo($handle['ch'], CURLINFO_HTTP_CODE);
    $results[] = ['idx' => $handle['idx'], 'code' => $code, 'body' => $body];

    if ($code === 201) {
        $created++;
    } else {
        $rejected++;
    }

    curl_multi_remove_handle($multi, $handle['ch']);
    curl_close($handle['ch']);
}

curl_multi_close($multi);

foreach ($results as $row) {
    echo "customer={$row['idx']} HTTP {$row['code']} ".substr($row['body'], 0, 120)."\n";
}

echo "created={$created} rejected={$rejected}\n";

$businessRejections = 0;
$protocolFailures = 0;

foreach ($results as $row) {
    if ($row['code'] === 201) {
        continue;
    }

    if (in_array($row['code'], [401, 419, 500], true)) {
        $protocolFailures++;
    } elseif (in_array($row['code'], [409, 422], true)) {
        $businessRejections++;
    }
}

$pass = $created === 1
    && $protocolFailures === 0
    && ($businessRejections + $created) === count($fixture['customers']);

echo "protocol_failures={$protocolFailures} business_rejections={$businessRejections}\n";
echo $pass ? "RESULT: PASS\n" : "RESULT: FAIL\n";
exit($pass ? 0 : 1);
