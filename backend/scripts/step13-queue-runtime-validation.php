<?php

declare(strict_types=1);

/**
 * Step 13 — Canonical 9-Queue Runtime Validation
 * Dispatches QueueIntegrationProbeJob across all 9 canonical queues
 * and verifies execution by the running queue-worker container.
 */

use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use App\Core\Support\Testing\QueueIntegrationProbeJob;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

echo "=== Step 13 Canonical 9-Queue Runtime Validation ===\n";

$canonicalQueues = [
    'critical',
    'notifications-high',
    'notifications',
    'notifications-low',
    'broadcast',
    'chat',
    'chat-low',
    'analytics',
    'default',
];

$tokens = [];
foreach ($canonicalQueues as $queue) {
    $token = $queue.'-'.Str::random(10);
    $tokens[$queue] = $token;
    echo "Dispatching probe job to queue [{$queue}] (token: {$token})...\n";
    QueueIntegrationProbeJob::dispatch($token)->onQueue($queue);
}

echo "All 9 probe jobs dispatched. Waiting for queue-worker to process...\n";

$startTime = microtime(true);
$timeout = 25.0; // 25 seconds timeout
$results = [];

while (microtime(true) - $startTime < $timeout) {
    $remaining = 0;
    foreach ($tokens as $queue => $token) {
        if (! isset($results[$queue])) {
            $value = Cache::get("queue:integration:probe:{$token}");
            if ($value !== null) {
                $latency = round((microtime(true) - $startTime) * 1000, 2);
                $results[$queue] = [
                    'status' => 'PROCESSED',
                    'latency_ms' => $latency,
                    'executed_at' => $value,
                ];
                echo "  [OK] Queue [{$queue}] processed in {$latency}ms\n";
            } else {
                $remaining++;
            }
        }
    }

    if ($remaining === 0) {
        break;
    }
    usleep(250000); // 250ms
}

$failedJobsCount = DB::table('failed_jobs')->count();

echo "\n--- Summary ---\n";
$allPassed = true;
foreach ($canonicalQueues as $queue) {
    if (isset($results[$queue])) {
        echo "Queue [{$queue}]: PASS (latency: {$results[$queue]['latency_ms']}ms)\n";
    } else {
        echo "Queue [{$queue}]: FAILED (timed out waiting for worker)\n";
        $allPassed = false;
    }
}

echo "Database failed_jobs count: {$failedJobsCount}\n";
if ($failedJobsCount > 0) {
    $allPassed = false;
}

echo $allPassed ? "\nVERDICT: ALL 9 CANONICAL QUEUES VERIFIED PASS\n" : "\nVERDICT: QUEUE VALIDATION FAILED\n";

exit($allPassed ? 0 : 1);
