<?php

declare(strict_types=1);

/**
 * Live Octane auth isolation probe — concurrent /auth/me with distinct session jars.
 *
 * Usage:
 *   php scripts/stage2817-octane-auth-isolation.php --base=http://127.0.0.1:8000 [--rounds=5] [--concurrency=40]
 */

$base = 'http://127.0.0.1:8000';
$rounds = 3;
$concurrency = 24;

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--base=')) {
        $base = rtrim(substr($arg, 7), '/');
    }
    if (str_starts_with($arg, '--rounds=')) {
        $rounds = max(1, (int) substr($arg, 9));
    }
    if (str_starts_with($arg, '--concurrency=')) {
        $concurrency = max(1, (int) substr($arg, 14));
    }
}

$accounts = [
    [
        'label' => 'customer_a',
        'login' => ['method' => 'phone', 'identifier' => '500000010', 'password' => 'Password123!'],
    ],
    [
        'label' => 'customer_b',
        'login' => ['method' => 'phone', 'identifier' => '500000011', 'password' => 'Password123!'],
    ],
];

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
    if (! is_readable($jar)) {
        return null;
    }

    foreach (file($jar, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
        if (str_contains($line, 'XSRF-TOKEN') && ! str_starts_with(trim($line), '#')) {
            $parts = preg_split('/\s+/', trim($line));

            return isset($parts[6]) ? urldecode($parts[6]) : null;
        }
    }

    return null;
}

function loginAccount(string $base, array $account): array
{
    $jar = sys_get_temp_dir().DIRECTORY_SEPARATOR.'diyar_auth_'.$account['label'].'_'.bin2hex(random_bytes(4)).'.cookies';
    @unlink($jar);

    req($base.'/sanctum/csrf-cookie', $jar);
    $token = xsrf($jar);

    $login = req(
        $base.'/api/v1/auth/login',
        $jar,
        [
            'Content-Type: application/json',
            'Referer: http://localhost:3000',
            'X-XSRF-TOKEN: '.($token ?? ''),
        ],
        json_encode($account['login'], JSON_THROW_ON_ERROR),
        'POST',
    );

    if ($login['code'] !== 200) {
        throw new RuntimeException("Login failed for {$account['label']}: HTTP {$login['code']} {$login['body']}");
    }

    $data = json_decode($login['body'], true, 512, JSON_THROW_ON_ERROR);
    $userId = $data['data']['user']['id'] ?? null;

    if (! is_string($userId) || $userId === '') {
        throw new RuntimeException("Missing user id for {$account['label']}");
    }

    return ['jar' => $jar, 'user_id' => $userId, 'label' => $account['label']];
}

function meUserId(string $base, string $jar): ?string
{
    $response = req($base.'/api/v1/auth/me', $jar, ['Referer: http://localhost:3000']);

    if ($response['code'] === 401) {
        return null;
    }

    if ($response['code'] !== 200) {
        throw new RuntimeException("Unexpected /auth/me HTTP {$response['code']}: {$response['body']}");
    }

    $data = json_decode($response['body'], true, 512, JSON_THROW_ON_ERROR);

    return $data['data']['user']['id'] ?? null;
}

echo "=== Octane auth isolation probe ===\n";
echo "base={$base} rounds={$rounds} concurrency={$concurrency}\n";

$slots = [];
foreach ($accounts as $account) {
    $slots[] = loginAccount($base, $account);
}
$guestJar = sys_get_temp_dir().DIRECTORY_SEPARATOR.'diyar_auth_guest_'.bin2hex(random_bytes(4)).'.cookies';
@unlink($guestJar);
req($base.'/sanctum/csrf-cookie', $guestJar);
$slots[] = ['jar' => $guestJar, 'user_id' => null, 'label' => 'guest'];

while (count($slots) < $concurrency) {
    $idx = count($slots) % (count($accounts) + 1);
    if ($idx === count($accounts)) {
        $copyJar = sys_get_temp_dir().DIRECTORY_SEPARATOR.'diyar_auth_guest_copy_'.bin2hex(random_bytes(4)).'.cookies';
        @copy($guestJar, $copyJar);
        $slots[] = ['jar' => $copyJar, 'user_id' => null, 'label' => 'guest_'.count($slots)];
    } else {
        $slots[] = loginAccount($base, [
            'label' => $accounts[$idx]['label'].'_'.count($slots),
            'login' => $accounts[$idx]['login'],
        ]);
    }
}

$mismatch = 0;
$total = 0;

for ($round = 1; $round <= $rounds; $round++) {
    $handles = [];
    $multi = curl_multi_init();

    for ($i = 0; $i < $concurrency; $i++) {
        $slot = $slots[$i];
        $jar = $slot['jar'];
        $expected = $slot['user_id'];

        $ch = curl_init($base.'/api/v1/auth/me');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_COOKIEJAR => $jar,
            CURLOPT_COOKIEFILE => $jar,
            CURLOPT_HTTPHEADER => ['Accept: application/json', 'Origin: http://localhost:3000', 'Referer: http://localhost:3000'],
        ]);
        curl_multi_add_handle($multi, $ch);
        $handles[] = ['ch' => $ch, 'expected' => $expected, 'pick' => $i];
    }

    do {
        $status = curl_multi_exec($multi, $running);
        curl_multi_select($multi, 1.0);
    } while ($running > 0 && $status === CURLM_OK);

    foreach ($handles as $handle) {
        $body = (string) curl_multi_getcontent($handle['ch']);
        $code = (int) curl_getinfo($handle['ch'], CURLINFO_HTTP_CODE);
        $total++;

        $actual = null;
        if ($code === 200) {
            $decoded = json_decode($body, true);
            $actual = $decoded['data']['user']['id'] ?? null;
        }

        $expected = $handle['expected'];
        $ok = ($expected === null && $code === 401) || ($expected !== null && $code === 200 && $actual === $expected);

        if (! $ok) {
            $mismatch++;
            echo "MISMATCH round={$round} pick={$handle['pick']} expected=".($expected ?? 'guest')." code={$code} actual=".($actual ?? 'null')."\n";
        }

        curl_multi_remove_handle($multi, $handle['ch']);
        curl_close($handle['ch']);
    }

    curl_multi_close($multi);
}

foreach ($slots as $session) {
    if (is_string($session['jar'] ?? null)) {
        @unlink($session['jar']);
    }
}

echo "total={$total} mismatches={$mismatch}\n";
echo $mismatch === 0 ? "RESULT: PASS (0 identity mismatches)\n" : "RESULT: FAIL\n";
exit($mismatch === 0 ? 0 : 1);
