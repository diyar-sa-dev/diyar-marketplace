<?php

declare(strict_types=1);

/**
 * Step 13B — Worker Lifecycle & Recycling Test
 * Probes Swoole worker PIDs before and after reaching the 500 max-request threshold.
 */

function getWorkerPids(): array
{
    $pids = [];
    foreach (glob('/proc/[0-9]*') as $p) {
        $pid = (int) basename($p);
        $cmd = @file_get_contents($p.'/cmdline');
        if ($cmd && str_contains($cmd, 'worker process for')) {
            $pids[] = $pid;
        }
    }
    sort($pids);
    return $pids;
}

echo "=== Octane Worker Lifecycle & Recycling Test ===\n";
$initialPids = getWorkerPids();
echo "Initial Worker PIDs: ".implode(', ', $initialPids)."\n";

if (count($initialPids) < 3) {
    // 2 app workers + 1 task worker = 3 worker processes
    echo "Warning: expected at least 3 worker processes (2 app + 1 task).\n";
}

$url = 'http://127.0.0.1:8000/api/v1/health';
$targetRequests = 1200; // Across 2 workers with max-requests=500, both will recycle
echo "Sending {$targetRequests} requests to {$url} to trigger 500-request recycle threshold...\n";

$start = microtime(true);
$completed = 0;
$errors = 0;

$mh = curl_multi_init();
$concurrency = 20;
$activeHandles = [];

for ($i = 0; $i < $concurrency; $i++) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ]);
    curl_multi_add_handle($mh, $ch);
    $activeHandles[] = $ch;
}

do {
    $status = curl_multi_exec($mh, $stillRunning);
    while ($info = curl_multi_info_read($mh)) {
        $completed++;
        $code = curl_getinfo($info['handle'], CURLINFO_HTTP_CODE);
        if ($code !== 200) {
            $errors++;
        }
        curl_multi_remove_handle($mh, $info['handle']);
        curl_close($info['handle']);

        if ($completed + count($activeHandles) - 1 < $targetRequests) {
            $newCh = curl_init($url);
            curl_setopt_array($newCh, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_HTTPHEADER => ['Accept: application/json'],
            ]);
            curl_multi_add_handle($mh, $newCh);
        }
    }
    if ($stillRunning > 0) {
        curl_multi_select($mh, 0.05);
    }
} while ($stillRunning > 0);

curl_multi_close($mh);
$duration = round(microtime(true) - $start, 2);
echo "Completed {$completed} requests in {$duration}s (Errors: {$errors})\n";

// Check new PIDs
$newPids = getWorkerPids();
echo "Post-Threshold Worker PIDs: ".implode(', ', $newPids)."\n";

$recycled = false;
$appWorkerPidsInitial = array_slice($initialPids, 1); // Task worker usually first or last
$appWorkerPidsNew = array_slice($newPids, 1);

$diff = array_diff($initialPids, $newPids);
if (!empty($diff)) {
    echo "[PASS] Worker Recycling Confirmed! Retired PIDs: ".implode(', ', $diff)."\n";
    echo "       New active PIDs: ".implode(', ', array_diff($newPids, $initialPids))."\n";
    $recycled = true;
} else {
    echo "[FAIL] Worker PIDs did not change.\n";
}

// Health check after recycling
$ch = curl_init($url);
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 5]);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($code === 200) {
    echo "[PASS] New workers are healthy and serving requests (HTTP 200).\n";
} else {
    echo "[FAIL] Health check failed post-recycle: HTTP {$code}\n";
}

echo "=== Lifecycle Test Complete ===\n";
