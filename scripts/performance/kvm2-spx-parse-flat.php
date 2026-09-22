<?php

declare(strict_types=1);

/**
 * Best-effort parser for SPX flat profile text embedded in .spx gzip or raw export.
 * Usage: php kvm2-spx-parse-flat.php path/to/report
 */

if ($argc < 2) {
    fwrite(STDERR, "usage: parse-spx.php <file>\n");
    exit(1);
}

$path = $argv[1];
$raw = file_get_contents($path);
if ($raw === false) {
    exit(1);
}

if (str_starts_with($raw, "\x1f\x8b")) {
    $raw = gzdecode($raw) ?: $raw;
}

$lines = preg_split('/\r\n|\n|\r/', $raw);
$rows = [];
foreach ($lines as $line) {
    if (! preg_match('/^\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s+(.+)$/', $line, $m)) {
        continue;
    }
    $rows[] = [
        'pct' => (float) $m[1],
        'calls' => (float) $m[2],
        'time_ms' => (float) $m[3],
        'symbol' => trim($m[4]),
    ];
}

usort($rows, fn ($a, $b) => $b['pct'] <=> $a['pct']);
$top = array_slice($rows, 0, 40);
echo json_encode(['top' => $top, 'parsed_lines' => count($rows)], JSON_PRETTY_PRINT);
