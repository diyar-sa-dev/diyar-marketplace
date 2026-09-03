<?php

declare(strict_types=1);

/**
 * Concurrent HTTP webhook ingestion (fake gateway).
 *
 * Usage:
 *   php scripts/stage2817-http-webhook-concurrency.php --base=http://127.0.0.1:8088 --payment-id=<uuid>
 */

$base = 'http://127.0.0.1:8088';
$paymentId = '';

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--base=')) {
        $base = rtrim(substr($arg, 7), '/');
    }
    if (str_starts_with($arg, '--payment-id=')) {
        $paymentId = substr($arg, 13);
    }
}

if ($paymentId === '') {
    fwrite(STDERR, "usage: --payment-id=uuid\n");
    exit(2);
}

$payload = json_encode([
    'event' => 'payment.paid',
    'payment_id' => $paymentId,
    'reference' => 'WH-CONC-'.bin2hex(random_bytes(4)),
], JSON_THROW_ON_ERROR);

$multi = curl_multi_init();
$handles = [];

for ($i = 0; $i < 8; $i++) {
    $ch = curl_init($base.'/api/v1/webhooks/payments/fake');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Content-Type: application/json',
        ],
    ]);
    curl_multi_add_handle($multi, $ch);
    $handles[] = $ch;
}

do {
    $status = curl_multi_exec($multi, $running);
    curl_multi_select($multi, 1.0);
} while ($running > 0 && $status === CURLM_OK);

$ok = 0;
$duplicate = 0;
$fail = 0;

foreach ($handles as $ch) {
    $body = (string) curl_multi_getcontent($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $decoded = json_decode($body, true);
    $isDuplicate = is_array($decoded) && ($decoded['data']['duplicate'] ?? false) === true;

    if ($code >= 200 && $code < 300) {
        $ok++;
        if ($isDuplicate) {
            $duplicate++;
        }
    } else {
        $fail++;
        echo "HTTP {$code} {$body}\n";
    }

    curl_multi_remove_handle($multi, $ch);
    curl_close($ch);
}

curl_multi_close($multi);

echo "=== HTTP webhook concurrency ===\n";
echo "ok={$ok} duplicate_responses={$duplicate} fail={$fail}\n";

$pass = $ok === 8 && $duplicate >= 7 && $fail === 0;
echo $pass ? "RESULT: PASS\n" : "RESULT: FAIL\n";
exit($pass ? 0 : 1);
