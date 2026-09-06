<?php

declare(strict_types=1);

/**
 * Controlled sustained HTTP load benchmark (non-k6).
 *
 * Usage:
 *   php scripts/stage2817-controlled-load.php --base=http://127.0.0.1:8088 --endpoint=/api/v1/categories --concurrency=25 --duration=15
 */
$base = 'http://127.0.0.1:8088';
$endpoint = '/api/v1/categories';
$concurrency = 10;
$durationSec = 10;

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--base=')) {
        $base = rtrim(substr($arg, 7), '/');
    }
    if (str_starts_with($arg, '--endpoint=')) {
        $endpoint = substr($arg, 11);
    }
    if (str_starts_with($arg, '--concurrency=')) {
        $concurrency = max(1, (int) substr($arg, 14));
    }
    if (str_starts_with($arg, '--duration=')) {
        $durationSec = max(1, (int) substr($arg, 11));
    }
}

$url = $base.$endpoint;
$latencies = [];
$errors = 0;
$status4xx = 0;
$status5xx = 0;
$completed = 0;
$deadline = microtime(true) + $durationSec;

echo "=== Controlled sustained HTTP load ===\n";
echo "url={$url} concurrency={$concurrency} duration={$durationSec}s\n";

while (microtime(true) < $deadline) {
    $multi = curl_multi_init();
    $handles = [];

    for ($i = 0; $i < $concurrency; $i++) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
            CURLOPT_TIMEOUT => 30,
        ]);
        curl_multi_add_handle($multi, $ch);
        $handles[] = ['ch' => $ch, 'start' => hrtime(true)];
    }

    do {
        $status = curl_multi_exec($multi, $running);
        curl_multi_select($multi, 0.5);
    } while ($running > 0 && $status === CURLM_OK);

    foreach ($handles as $handle) {
        $code = (int) curl_getinfo($handle['ch'], CURLINFO_HTTP_CODE);
        $ms = (int) round((hrtime(true) - $handle['start']) / 1_000_000);
        $completed++;

        if ($code >= 500) {
            $status5xx++;
            $errors++;
        } elseif ($code >= 400) {
            $status4xx++;
        } elseif ($code < 200 || $code >= 300) {
            $errors++;
        } else {
            $latencies[] = $ms;
        }

        curl_multi_remove_handle($multi, $handle['ch']);
        curl_close($handle['ch']);
    }

    curl_multi_close($multi);
}

sort($latencies);
$p = static function (array $values, float $pct): int {
    if ($values === []) {
        return 0;
    }
    $idx = (int) floor(($pct / 100) * (count($values) - 1));

    return $values[$idx];
};

$rps = $durationSec > 0 ? round($completed / $durationSec, 2) : 0;

echo "completed={$completed} rps={$rps} errors={$errors} 4xx={$status4xx} 5xx={$status5xx}\n";
if ($latencies !== []) {
    echo sprintf(
        "latency_ms: p50=%d p95=%d p99=%d max=%d avg=%d n=%d\n",
        $p($latencies, 50),
        $p($latencies, 95),
        $p($latencies, 99),
        max($latencies),
        (int) round(array_sum($latencies) / count($latencies)),
        count($latencies),
    );
}

exit($status5xx > 0 ? 1 : 0);
