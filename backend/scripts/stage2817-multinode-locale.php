<?php

declare(strict_types=1);

/**
 * Locale isolation through nginx → alternating Octane nodes.
 *
 * Usage: php scripts/stage2817-multinode-locale.php --base=http://127.0.0.1:8088
 */

$base = 'http://127.0.0.1:8088';

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--base=')) {
        $base = rtrim(substr($arg, 7), '/');
    }
}

$sequence = [
    ['locale' => 'ar', 'header' => 'ar'],
    ['locale' => 'en', 'header' => 'en'],
    ['locale' => 'fr', 'header' => 'fr'],
    ['locale' => 'ar', 'header' => 'ar'],
    ['locale' => 'en', 'header' => 'en'],
];

$failures = 0;

echo "=== Multi-node locale probe ===\nbase={$base}\n";

foreach ($sequence as $idx => $item) {
    $ch = curl_init($base.'/api/v1/health');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'X-Locale: '.$item['header'],
            'Accept-Language: '.$item['header'],
        ],
    ]);
    $body = (string) curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code !== 200) {
        echo "FAIL request {$idx} HTTP {$code}\n";
        $failures++;
        continue;
    }

    $json = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
    $node = $json['data']['runtime_probe']['node_id'] ?? 'unknown';
    echo "request={$idx} locale={$item['locale']} node={$node} status=ok\n";
}

echo $failures === 0 ? "RESULT: PASS (no HTTP failures; locale headers accepted per request)\n" : "RESULT: FAIL\n";
exit($failures === 0 ? 0 : 1);
