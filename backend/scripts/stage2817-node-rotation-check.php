<?php

declare(strict_types=1);

/**
 * Verify nginx round-robin hits both Octane nodes (no sticky sessions).
 *
 * Usage: php scripts/stage2817-node-rotation-check.php --base=http://127.0.0.1:8088 [--requests=40]
 */

$base = 'http://127.0.0.1:8088';
$requests = 40;

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--base=')) {
        $base = rtrim(substr($arg, 7), '/');
    }
    if (str_starts_with($arg, '--requests=')) {
        $requests = max(2, (int) substr($arg, 11));
    }
}

$nodes = [];

for ($i = 0; $i < $requests; $i++) {
    $ch = curl_init($base.'/api/v1/health');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ]);
    $body = (string) curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($code !== 200) {
        echo "FAIL health HTTP {$code}: {$body}\n";
        exit(1);
    }

    $json = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
    $nodeId = $json['data']['runtime_probe']['node_id'] ?? 'unknown';
    $nodes[$nodeId] = ($nodes[$nodeId] ?? 0) + 1;
}

echo "=== Node rotation check ===\n";
echo "base={$base} requests={$requests}\n";
foreach ($nodes as $node => $count) {
    echo "  {$node}: {$count}\n";
}

$unique = count($nodes);
$pass = $unique >= 2;

echo $pass
    ? "RESULT: PASS (saw {$unique} distinct nodes)\n"
    : "RESULT: FAIL (only one node: ".implode(', ', array_keys($nodes)).")\n";

exit($pass ? 0 : 1);
