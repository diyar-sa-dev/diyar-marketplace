<?php

declare(strict_types=1);

/**
 * Sequential auth sanity check against a running API (Octane or FPM).
 *
 * Usage: php scripts/stage2817-auth-sequential-check.php [base_url]
 */
$base = rtrim($argv[1] ?? 'http://127.0.0.1:8000', '/');
$jar = sys_get_temp_dir().DIRECTORY_SEPARATOR.'diyar_seq_check_'.getmypid().'.cookies';
@unlink($jar);

function req(string $url, string $jar, array $headers = [], ?string $post = null): array
{
    $h = array_merge(['Accept: application/json', 'Origin: http://localhost:3000'], $headers);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_COOKIEJAR => $jar,
        CURLOPT_COOKIEFILE => $jar,
        CURLOPT_HTTPHEADER => $h,
        CURLOPT_HEADER => true,
    ]);

    if ($post !== null) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
    }

    $raw = (string) curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['code' => $code, 'raw' => $raw];
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

echo "=== Sequential auth check: {$base} ===\n";

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
    json_encode([
        'method' => 'phone',
        'identifier' => '500000010',
        'password' => 'Password123!',
    ], JSON_THROW_ON_ERROR),
);

echo "login HTTP {$login['code']}\n";

$me = req(
    $base.'/api/v1/auth/me',
    $jar,
    ['Referer: http://localhost:3000'],
);

echo "me-after-login HTTP {$me['code']}\n";

$logout = req(
    $base.'/api/v1/auth/logout',
    $jar,
    [
        'Content-Type: application/json',
        'Referer: http://localhost:3000',
        'X-XSRF-TOKEN: '.(xsrf($jar) ?? ''),
    ],
    '{}',
);

echo "logout HTTP {$logout['code']}\n";

$me2 = req(
    $base.'/api/v1/auth/me',
    $jar,
    ['Referer: http://localhost:3000'],
);

echo "me-after-logout HTTP {$me2['code']}\n";

$ok = $login['code'] === 200 && $me['code'] === 200 && $logout['code'] === 200 && $me2['code'] === 401;
echo $ok ? "RESULT: PASS\n" : "RESULT: FAIL\n";

@unlink($jar);
exit($ok ? 0 : 1);
