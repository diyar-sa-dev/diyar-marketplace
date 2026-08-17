<?php

/**
 * MyFatoorah sandbox API reachability probe.
 * Loads Laravel config from .env — never prints the API key.
 *
 * Usage: php tests/Scripts/myfatoorah_sandbox_probe.php
 */

declare(strict_types=1);
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$apiKey = (string) config('myfatoorah.api_key', '');

if ($apiKey === '') {
    fwrite(STDERR, "RESULT: BLOCKED — MYFATOORAH_API_KEY is not configured\n");
    exit(2);
}

$payload = json_encode([
    'PaymentMethod' => 'CARD',
    'Order' => [
        'Amount' => 10,
    ],
], JSON_THROW_ON_ERROR);

$ch = curl_init('https://apitest.myfatoorah.com/v3/payments');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer '.$apiKey,
        'Content-Type: application/json',
        'Accept: application/json',
    ],
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_TIMEOUT => 30,
]);

$response = curl_exec($ch);
$httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($response === false) {
    fwrite(STDERR, "RESULT: BLOCKED — cURL error: {$error}\n");
    exit(3);
}

$decoded = json_decode($response, true);
$message = is_array($decoded) ? ($decoded['Message'] ?? $decoded['message'] ?? 'unknown') : 'non-json response';

echo 'RESULT: HTTP '.$httpCode.PHP_EOL;
echo 'MESSAGE: '.(is_string($message) ? $message : json_encode($message)).PHP_EOL;

if ($httpCode >= 200 && $httpCode < 500) {
    echo "API_REACHABLE: yes\n";
    exit(0);
}

echo "API_REACHABLE: no\n";
exit(1);
