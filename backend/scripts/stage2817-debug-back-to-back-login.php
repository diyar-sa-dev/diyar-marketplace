<?php

declare(strict_types=1);

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
    foreach (file($jar, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
        if (str_contains($line, 'XSRF-TOKEN') && ! str_starts_with(trim($line), '#')) {
            $parts = preg_split('/\s+/', trim($line));

            return isset($parts[6]) ? urldecode($parts[6]) : null;
        }
    }

    return null;
}

function login(string $base, array $payload, string $label): string
{
    $jar = sys_get_temp_dir().DIRECTORY_SEPARATOR.'diyar_seq_'.$label.'.cookies';
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
    echo "Login {$label}: {$login['code']}\n";

    return $jar;
}

$jarA = login($base, ['method' => 'phone', 'identifier' => '500000010', 'password' => 'Password123!'], 'a');
$jarB = login($base, ['method' => 'phone', 'identifier' => '500000002', 'password' => 'Password123!'], 'b');
$meA = req($base.'/api/v1/auth/me', $jarA, ['Referer: http://localhost:3000']);
echo "Me A after both logins (no me between): {$meA['code']}\n";
