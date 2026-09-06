<?php

declare(strict_types=1);

/**
 * Hostinger KVM 2 vs KVM 4 — measured capacity audit (local Docker proxy).
 *
 * Captures HTTP throughput/latency + Docker container CPU/RAM during representative load.
 * Does NOT claim Hostinger VPS numbers — maps measured stack footprint to plan budgets.
 *
 * Usage:
 *   php scripts/stage2817-hosting-capacity-audit.php --profile=octane-multinode
 *   php scripts/stage2817-hosting-capacity-audit.php --profile=fpm
 */
$profiles = [
    'octane-multinode' => [
        'label' => 'octane-multinode',
        'base' => 'http://127.0.0.1:8088',
        'containers' => [
            'diyar-multinode-nginx-1',
            'diyar-multinode-api-a-1',
            'diyar-multinode-api-b-1',
            'diyar-multinode-mysql-1',
            'diyar-multinode-redis-1',
            'diyar-multinode-queue-worker-1-1',
            'diyar-multinode-queue-worker-2-1',
            'diyar-multinode-scheduler-a-1',
        ],
        'mysql_container' => 'diyar-multinode-mysql-1',
        'redis_container' => 'diyar-multinode-redis-1',
        'mysql_password' => 'multinode',
    ],
    'fpm' => [
        'label' => 'fpm-production-like',
        'base' => 'http://127.0.0.1:8080',
        'containers' => [
            'diyar-fpm-nginx-1',
            'diyar-fpm-app-1',
            'diyar-fpm-mysql-1',
            'diyar-fpm-redis-1',
        ],
        'mysql_container' => 'diyar-fpm-mysql-1',
        'redis_container' => 'diyar-fpm-redis-1',
        'mysql_password' => 'prodlike_root',
    ],
];

$profileKey = 'octane-multinode';
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--profile=')) {
        $profileKey = substr($arg, 10);
    }
}

if (! isset($profiles[$profileKey])) {
    fwrite(STDERR, "Unknown profile: {$profileKey}\n");
    exit(1);
}

$profile = $profiles[$profileKey];
$base = $profile['base'];
$outDir = dirname(__DIR__).'/../conception/Stages/Stage 28/Phase 28.17 - Enterprise Concurrency & Octane Hardening/_raw';
@mkdir($outDir, 0777, true);

function percentile(array $values, float $p): int
{
    if ($values === []) {
        return 0;
    }
    sort($values);
    $idx = (int) floor(($p / 100) * (count($values) - 1));

    return $values[$idx];
}

function dockerStats(array $containers): array
{
    $names = implode(' ', array_map('escapeshellarg', $containers));
    $cmd = "docker stats --no-stream --format \"{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.BlockIO}}\" {$names} 2>NUL";
    $output = shell_exec($cmd) ?? '';
    $rows = [];
    foreach (explode("\n", trim($output)) as $line) {
        if ($line === '') {
            continue;
        }
        $parts = explode('|', $line);
        if (count($parts) < 4) {
            continue;
        }
        [$name, $cpu, $memUsage, $memPerc] = $parts;
        preg_match('/([\d.]+)([KMG]iB)/', $memUsage, $usedMatch);
        preg_match('/([\d.]+)([KMG]iB)/', $memUsage, $limitMatch, PREG_OFFSET_CAPTURE);
        $usedMiB = parseMemToMiB($usedMatch[1] ?? '0', $usedMatch[2] ?? 'MiB');
        $rows[$name] = [
            'cpu_percent' => (float) rtrim(trim($cpu), '%'),
            'mem_used_mib' => round($usedMiB, 1),
            'mem_percent' => (float) rtrim(trim($memPerc), '%'),
            'raw_mem' => trim($memUsage),
        ];
    }

    return $rows;
}

function parseMemToMiB(string $value, string $unit): float
{
    $v = (float) $value;

    return match ($unit) {
        'GiB' => $v * 1024,
        'KiB' => $v / 1024,
        default => $v,
    };
}

function runLoad(string $url, int $concurrency, int $durationSec): array
{
    $latencies = [];
    $errors = 0;
    $status5xx = 0;
    $completed = 0;
    $deadline = microtime(true) + $durationSec;

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

    return [
        'completed' => $completed,
        'rps' => $durationSec > 0 ? round($completed / $durationSec, 2) : 0,
        'errors' => $errors,
        'status5xx' => $status5xx,
        'p50_ms' => percentile($latencies, 50),
        'p95_ms' => percentile($latencies, 95),
        'p99_ms' => percentile($latencies, 99),
        'max_ms' => $latencies !== [] ? max($latencies) : 0,
        'avg_ms' => $latencies !== [] ? (int) round(array_sum($latencies) / count($latencies)) : 0,
        'success_samples' => count($latencies),
    ];
}

function mysqlMetrics(string $container, string $password): array
{
    $sql = "SHOW GLOBAL STATUS WHERE Variable_name IN ('Threads_connected','Max_used_connections','Slow_queries','Questions','Uptime'); SHOW VARIABLES LIKE 'max_connections';";
    $cmd = sprintf(
        'docker exec %s mysql -uroot -p%s -N -e %s 2>NUL',
        escapeshellarg($container),
        escapeshellarg($password),
        escapeshellarg($sql),
    );
    $out = shell_exec($cmd) ?? '';
    $metrics = [];
    foreach (explode("\n", trim($out)) as $line) {
        $parts = preg_split('/\s+/', trim($line), 2);
        if (count($parts) === 2) {
            $metrics[$parts[0]] = $parts[1];
        }
    }

    return $metrics;
}

function redisMetrics(string $container): array
{
    $cmd = sprintf('docker exec %s redis-cli INFO memory 2>NUL', escapeshellarg($container));
    $out = shell_exec($cmd) ?? '';
    $metrics = [];
    foreach (explode("\n", $out) as $line) {
        if (! str_contains($line, ':')) {
            continue;
        }
        [$k, $v] = explode(':', trim($line), 2);
        $metrics[$k] = $v;
    }

    $latencyCmd = sprintf('docker exec %s redis-cli --latency-history -i 1 2>NUL', escapeshellarg($container));
    // Sample once via ping
    $pingCmd = sprintf('docker exec %s redis-cli --raw DEBUG SLEEP 0 2>NUL', escapeshellarg($container));
    shell_exec($pingCmd);
    $pingOut = shell_exec(sprintf('docker exec %s redis-cli PING 2>NUL', escapeshellarg($container))) ?? '';

    return [
        'used_memory_human' => $metrics['used_memory_human'] ?? null,
        'used_memory_rss_human' => $metrics['used_memory_rss_human'] ?? null,
        'maxmemory_human' => $metrics['maxmemory_human'] ?? '0',
        'mem_fragmentation_ratio' => $metrics['mem_fragmentation_ratio'] ?? null,
        'ping' => trim($pingOut),
    ];
}

$workloads = [
    ['name' => 'health', 'endpoint' => '/api/v1/health', 'concurrency' => 50, 'duration' => 10],
    ['name' => 'categories', 'endpoint' => '/api/v1/categories', 'concurrency' => 10, 'duration' => 10],
    ['name' => 'catalog_search', 'endpoint' => '/api/v1/catalog/search?q=bed&type=products', 'concurrency' => 25, 'duration' => 15],
    ['name' => 'products', 'endpoint' => '/api/v1/products?per_page=12', 'concurrency' => 15, 'duration' => 10],
];

$saturationSweep = [
    ['concurrency' => 5, 'duration' => 10],
    ['concurrency' => 10, 'duration' => 10],
    ['concurrency' => 25, 'duration' => 10],
    ['concurrency' => 50, 'duration' => 10],
    ['concurrency' => 75, 'duration' => 10],
    ['concurrency' => 100, 'duration' => 10],
];

echo "=== DIYAR Hosting Capacity Audit ===\n";
echo "profile={$profile['label']} base={$base}\n";
echo 'timestamp='.date('c')."\n\n";

$report = [
    'profile' => $profile['label'],
    'base' => $base,
    'timestamp' => date('c'),
    'environment_note' => 'Local Windows Docker — NOT Hostinger VPS. Used to measure relative stack footprint and scaling behavior.',
    'hostinger_plans' => [
        'kvm2' => ['vcpu' => 2, 'ram_gib' => 8, 'nvme_gib' => 100],
        'kvm4' => ['vcpu' => 4, 'ram_gib' => 16, 'nvme_gib' => 200],
    ],
    'idle_stats' => dockerStats($profile['containers']),
    'idle_mysql' => mysqlMetrics($profile['mysql_container'], $profile['mysql_password']),
    'idle_redis' => redisMetrics($profile['redis_container']),
    'workloads' => [],
    'saturation_sweep' => [],
];

$totalIdleMem = array_sum(array_column($report['idle_stats'], 'mem_used_mib'));
$totalIdleCpu = array_sum(array_column($report['idle_stats'], 'cpu_percent'));
echo sprintf("IDLE: total_mem=%.1f MiB total_cpu=%.1f%%\n\n", $totalIdleMem, $totalIdleCpu);

foreach ($workloads as $wl) {
    $url = $base.$wl['endpoint'];
    echo "--- workload {$wl['name']} concurrency={$wl['concurrency']} duration={$wl['duration']}s ---\n";
    $statsBefore = dockerStats($profile['containers']);
    $result = runLoad($url, $wl['concurrency'], $wl['duration']);
    usleep(500_000);
    $statsDuring = dockerStats($profile['containers']);

    $entry = [
        'endpoint' => $wl['endpoint'],
        'concurrency' => $wl['concurrency'],
        'duration_sec' => $wl['duration'],
        'http' => $result,
        'stats_before' => $statsBefore,
        'stats_after' => $statsDuring,
        'mysql' => mysqlMetrics($profile['mysql_container'], $profile['mysql_password']),
        'redis' => redisMetrics($profile['redis_container']),
    ];
    $report['workloads'][] = $entry;

    echo sprintf(
        "rps=%.2f p50=%d p95=%d p99=%d max=%d 5xx=%d\n",
        $result['rps'],
        $result['p50_ms'],
        $result['p95_ms'],
        $result['p99_ms'],
        $result['max_ms'],
        $result['status5xx'],
    );
    $loadMem = array_sum(array_column($statsDuring, 'mem_used_mib'));
    $loadCpu = array_sum(array_column($statsDuring, 'cpu_percent'));
    echo sprintf("LOAD stats: total_mem=%.1f MiB total_cpu=%.1f%%\n\n", $loadMem, $loadCpu);
}

$searchUrl = $base.'/api/v1/catalog/search?q=bed&type=products';
echo "=== Saturation sweep (catalog search) ===\n";
foreach ($saturationSweep as $step) {
    echo "concurrency={$step['concurrency']} duration={$step['duration']}s ... ";
    $stats = dockerStats($profile['containers']);
    $result = runLoad($searchUrl, $step['concurrency'], $step['duration']);
    $statsAfter = dockerStats($profile['containers']);
    $entry = [
        'concurrency' => $step['concurrency'],
        'http' => $result,
        'stats' => $statsAfter,
        'total_cpu_percent' => array_sum(array_column($statsAfter, 'cpu_percent')),
        'total_mem_mib' => array_sum(array_column($statsAfter, 'mem_used_mib')),
    ];
    $report['saturation_sweep'][] = $entry;
    echo sprintf(
        "rps=%.1f p95=%d 5xx=%d cpu=%.1f%% mem=%.0fMiB\n",
        $result['rps'],
        $result['p95_ms'],
        $result['status5xx'],
        $entry['total_cpu_percent'],
        $entry['total_mem_mib'],
    );
}

// Plan fit analysis
$peakMem = max(array_merge(
    [$totalIdleMem],
    array_map(fn ($w) => array_sum(array_column($w['stats_after'], 'mem_used_mib')), $report['workloads']),
    array_column($report['saturation_sweep'], 'total_mem_mib'),
));
$peakCpu = max(array_merge(
    [$totalIdleCpu],
    array_map(fn ($s) => $s['total_cpu_percent'], $report['saturation_sweep']),
));

$osOverheadMiB = 1024; // conservative Linux + monitoring reserve
$kvm2BudgetMiB = (8 * 1024) - $osOverheadMiB;
$kvm4BudgetMiB = (16 * 1024) - $osOverheadMiB;

$report['plan_fit'] = [
    'peak_measured_stack_mem_mib' => round($peakMem, 1),
    'peak_measured_stack_cpu_percent' => round($peakCpu, 1),
    'os_overhead_assumption_mib' => $osOverheadMiB,
    'kvm2_usable_ram_mib' => $kvm2BudgetMiB,
    'kvm4_usable_ram_mib' => $kvm4BudgetMiB,
    'kvm2_mem_headroom_mib' => round($kvm2BudgetMiB - $peakMem, 1),
    'kvm4_mem_headroom_mib' => round($kvm4BudgetMiB - $peakMem, 1),
    'note_cpu' => 'Docker CPU% is relative to host logical CPUs, not VPS vCPU. Compare saturation sweep trends, not absolute %.',
];

echo "\n=== Plan fit (RAM only — measured Docker stack) ===\n";
echo sprintf("Peak stack RAM: %.1f MiB\n", $peakMem);
echo sprintf("KVM 2 usable (~7 GiB after OS): %.1f MiB headroom = %.1f MiB\n", $kvm2BudgetMiB, $report['plan_fit']['kvm2_mem_headroom_mib']);
echo sprintf("KVM 4 usable (~15 GiB after OS): %.1f MiB headroom = %.1f MiB\n", $kvm4BudgetMiB, $report['plan_fit']['kvm4_mem_headroom_mib']);

$jsonPath = $outDir.'/hosting-audit-'.$profile['label'].'-'.date('Ymd-His').'.json';
file_put_contents($jsonPath, json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo "\nWrote {$jsonPath}\n";
