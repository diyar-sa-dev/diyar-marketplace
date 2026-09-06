<?php

declare(strict_types=1);

$base = 'http://127.0.0.1:8088';
$jar = sys_get_temp_dir().DIRECTORY_SEPARATOR.'debug_auth.cookies';
@unlink($jar);

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

req($base.'/sanctum/csrf-cookie', $jar);
$xsrf = null;
foreach (file($jar, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
    if (str_contains($line, 'XSRF-TOKEN') && ! str_starts_with(trim($line), '#')) {
        $parts = preg_split('/\s+/', trim($line));
        $xsrf = isset($parts[6]) ? urldecode($parts[6]) : null;
    }
}

$login = req(
    $base.'/api/v1/auth/login',
    $jar,
    ['Content-Type: application/json', 'Referer: http://localhost:3000', 'X-XSRF-TOKEN: '.($xsrf ?? '')],
    json_encode(['method' => 'phone', 'identifier' => '500000010', 'password' => 'Password123!'], JSON_THROW_ON_ERROR),
    'POST',
);
echo "LOGIN {$login['code']}\n{$login['body']}\n\n";

$me = req($base.'/api/v1/auth/me', $jar, ['Referer: http://localhost:3000']);
echo "ME {$me['code']}\n{$me['body']}\n";

$loginData = json_decode($login['body'], true);
$meData = json_decode($me['body'], true);
$loginId = $loginData['data']['user']['id'] ?? null;
$meId = $meData['data']['user']['id'] ?? null;
echo "\nlogin_id=".var_export($loginId, true).' type='.gettype($loginId)."\n";
echo 'me_id='.var_export($meId, true).' type='.gettype($meId)."\n";
echo 'strict_equal='.var_export($loginId === $meId, true)."\n";
echo 'loose_equal='.var_export($loginId == $meId, true)."\n";
