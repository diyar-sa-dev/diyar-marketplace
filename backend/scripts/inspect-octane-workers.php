<?php

declare(strict_types=1);

/**
 * Inspect Octane Swoole processes, PIDs, roles, and RSS memory via /proc.
 */
$processes = [];
foreach (glob('/proc/[0-9]*') as $p) {
    $pid = (int) basename($p);
    $cmd = @file_get_contents($p.'/cmdline');
    if ($cmd === false || $cmd === '') {
        continue;
    }
    $cmd = str_replace(chr(0), ' ', trim($cmd));
    $status = @file_get_contents($p.'/status');
    $rss = 0;
    if ($status && preg_match('/VmRSS:\s+(\d+)\s+kB/', $status, $m)) {
        $rss = (int) $m[1];
    }
    $ppid = 0;
    if ($status && preg_match('/PPid:\s+(\d+)/', $status, $m)) {
        $ppid = (int) $m[1];
    }
    $processes[] = [
        'pid' => $pid,
        'ppid' => $ppid,
        'rss_kb' => $rss,
        'cmd' => $cmd,
    ];
}

usort($processes, fn($a, $b) => $a['pid'] <=> $b['pid']);

echo sprintf("%-6s %-6s %-12s %s\n", "PID", "PPID", "RSS (MB)", "COMMAND");
echo str_repeat("-", 80)."\n";
foreach ($processes as $proc) {
    echo sprintf(
        "%-6d %-6d %-12.2f %s\n",
        $proc['pid'],
        $proc['ppid'],
        $proc['rss_kb'] / 1024,
        substr($proc['cmd'], 0, 70)
    );
}

// Summary of Octane state
$stateFile = __DIR__.'/../storage/logs/octane-server-state.json';
if (file_exists($stateFile)) {
    $state = json_decode(file_get_contents($stateFile), true);
    echo "\nOctane Server State JSON:\n";
    echo "  Master PID:  ".($state['masterProcessId'] ?? 'N/A')."\n";
    echo "  Manager PID: ".($state['managerProcessId'] ?? 'N/A')."\n";
    echo "  Workers:     ".($state['state']['workers'] ?? 'N/A')."\n";
    echo "  TaskWorkers: ".($state['state']['taskWorkers'] ?? 'N/A')."\n";
    echo "  MaxRequests: ".($state['state']['maxRequests'] ?? 'N/A')."\n";
}
