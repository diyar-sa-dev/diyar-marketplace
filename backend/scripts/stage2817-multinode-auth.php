<?php

declare(strict_types=1);

/**
 * Multi-node session auth: login once, /me through LB many times, two users cross-node.
 *
 * Usage: php scripts/stage2817-multinode-auth.php --base=http://127.0.0.1:8088
 */

$base = 'http://127.0.0.1:8088';

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--base=')) {
        $base = rtrim(substr($arg, 7), '/');
    }
}

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

function login(string $base, array $payload, string $label): array
{
    $jar = sys_get_temp_dir().DIRECTORY_SEPARATOR.'diyar_mn_'.$label.'_'.bin2hex(random_bytes(4)).'.cookies';
    @unlink($jar);
    req($base.'/sanctum/csrf-cookie', $jar);
    $token = xsrf($jar);
    $login = req(
        $base.'/api/v1/auth/login',
        $jar,
        ['Content-Type: application/json', 'Referer: http://localhost:3000', 'X-XSRF-TOKEN: '.($token ?? '')],
        json_encode($payload, JSON_THROW_ON_ERROR),
        'POST',
    );
    if ($login['code'] !== 200) {
        throw new RuntimeException("Login {$label} failed: HTTP {$login['code']} {$login['body']}");
    }
    $data = json_decode($login['body'], true, 512, JSON_THROW_ON_ERROR);
    $userId = $data['data']['user']['id'] ?? null;
    if (! is_string($userId)) {
        throw new RuntimeException("Missing user id for {$label}");
    }

    return ['jar' => $jar, 'user_id' => $userId, 'label' => $label];
}

function meCheck(string $base, string $jar, ?string $expectedUserId, bool $verbose = false): bool
{
    $response = req($base.'/api/v1/auth/me', $jar, ['Referer: http://localhost:3000']);
    if ($expectedUserId === null) {
        return $response['code'] === 401;
    }
    if ($response['code'] !== 200) {
        if ($verbose) {
            echo "  /me HTTP {$response['code']}: {$response['body']}\n";
        }

        return false;
    }
    $data = json_decode($response['body'], true, 512, JSON_THROW_ON_ERROR);
    $actual = $data['data']['user']['id'] ?? null;
    $match = (string) $actual === (string) $expectedUserId;
    if (! $match && $verbose) {
        echo "  /me id mismatch expected={$expectedUserId} actual=".var_export($actual, true)."\n";
    }

    return $match;
}

echo "=== Multi-node auth probe ===\nbase={$base}\n";

$failures = 0;

$userA = login($base, ['method' => 'phone', 'identifier' => '500000010', 'password' => 'Password123!'], 'a');
$userB = login($base, ['method' => 'phone', 'identifier' => '500000002', 'password' => 'Password123!'], 'b');

for ($i = 0; $i < 20; $i++) {
    if (! meCheck($base, $userA['jar'], $userA['user_id'], $i === 0)) {
        echo "FAIL user A /me mismatch on iteration {$i}\n";
        $failures++;
    }
    if (! meCheck($base, $userB['jar'], $userB['user_id'], $i === 0)) {
        echo "FAIL user B /me mismatch on iteration {$i}\n";
        $failures++;
    }
}

for ($i = 0; $i < 10; $i++) {
    if (! meCheck($base, $userA['jar'], $userA['user_id'])) {
        $failures++;
    }
    if (! meCheck($base, $userB['jar'], $userB['user_id'])) {
        $failures++;
    }
}

@unlink($userA['jar']);
@unlink($userB['jar']);

echo "failures={$failures}\n";
echo $failures === 0 ? "RESULT: PASS\n" : "RESULT: FAIL\n";
exit($failures === 0 ? 0 : 1);
