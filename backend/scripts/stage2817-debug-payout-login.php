<?php

declare(strict_types=1);
$base = 'http://127.0.0.1:8088';
$jar = sys_get_temp_dir().'/payout_login_test.cookies';
@unlink($jar);
function req($url, $jar, $h = [], $body = null, $m = 'GET')
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => 1, CURLOPT_COOKIEJAR => $jar, CURLOPT_COOKIEFILE => $jar, CURLOPT_HTTPHEADER => array_merge(['Accept: application/json', 'Origin: http://localhost:3000'], $h), CURLOPT_CUSTOMREQUEST => $m]);
    if ($body) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }$r = curl_exec($ch);
    $c = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [$c, $r];
}
req($base.'/sanctum/csrf-cookie', $jar);
$xsrf = null;
foreach (file($jar) ?: [] as $l) {
    if (str_contains($l, 'XSRF-TOKEN')) {
        $p = preg_split('/\s+/', trim($l));
        $xsrf = urldecode($p[6] ?? '');
    }
}
[$c,$b] = req($base.'/api/v1/auth/login', $jar, ['Content-Type: application/json', 'Referer: http://localhost:3000', 'X-XSRF-TOKEN:'.$xsrf], json_encode(['method' => 'phone', 'identifier' => '50903001', 'password' => 'Password123!']), 'POST');
echo "login $c\n$b\n";
