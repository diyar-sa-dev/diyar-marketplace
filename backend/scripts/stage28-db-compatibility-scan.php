<?php

declare(strict_types=1);

/**
 * Stage 28.2 — Static scan for database-specific SQL constructs.
 * Usage: php scripts/stage28-db-compatibility-scan.php
 */
$root = dirname(__DIR__);
$patterns = [
    'DB::raw' => '/DB::raw\s*\(/',
    'selectRaw' => '/->selectRaw\s*\(/',
    'whereRaw' => '/->whereRaw\s*\(/',
    'orderByRaw' => '/->orderByRaw\s*\(/',
    'havingRaw' => '/->havingRaw\s*\(/',
    'groupByRaw' => '/->groupByRaw\s*\(/',
    'joinRaw' => '/->joinRaw\s*\(/',
    'insertOrIgnore' => '/->insertOrIgnore\s*\(/',
    'upsert' => '/->upsert\s*\(/',
    'ON DUPLICATE KEY' => '/ON DUPLICATE KEY/i',
    'JSON_EXTRACT' => '/JSON_EXTRACT/i',
    'JSON_CONTAINS' => '/JSON_CONTAINS/i',
    'JSON_UNQUOTE' => '/JSON_UNQUOTE/i',
    'DATE_FORMAT' => '/DATE_FORMAT\s*\(/',
    'TIMESTAMPDIFF' => '/TIMESTAMPDIFF\s*\(/',
    'STR_TO_DATE' => '/STR_TO_DATE\s*\(/',
    'IFNULL' => '/IFNULL\s*\(/',
    'COALESCE' => '/COALESCE\s*\(/',
    'LOWER(' => '/LOWER\s*\(/',
    'ILIKE' => '/ILIKE/i',
    'FOR UPDATE' => '/forUpdate\s*\(|FOR UPDATE/i',
    'LOCK IN SHARE MODE' => '/sharedLock\s*\(|LOCK IN SHARE MODE/i',
];

$dirs = [
    $root.'/app',
    $root.'/database/migrations',
    $root.'/database/seeders',
    $root.'/tests',
];

$findings = [];
foreach ($dirs as $dir) {
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
    foreach ($iterator as $file) {
        if (! $file->isFile() || $file->getExtension() !== 'php') {
            continue;
        }
        $path = $file->getPathname();
        $content = file_get_contents($path);
        if ($content === false) {
            continue;
        }
        foreach ($patterns as $label => $regex) {
            if (preg_match_all($regex, $content, $m, PREG_OFFSET_CAPTURE)) {
                foreach ($m[0] as $match) {
                    $line = substr_count(substr($content, 0, $match[1]), "\n") + 1;
                    $rel = str_replace('\\', '/', substr($path, strlen(dirname($root)) + 1));
                    $findings[] = [
                        'construct' => $label,
                        'file' => $rel,
                        'line' => $line,
                        'classification' => classifyConstruct($label),
                    ];
                }
            }
        }
    }
}

function classifyConstruct(string $label): string
{
    return match ($label) {
        'ILIKE' => 'PostgreSQL-specific',
        'JSON_EXTRACT', 'JSON_CONTAINS', 'JSON_UNQUOTE', 'DATE_FORMAT', 'TIMESTAMPDIFF', 'STR_TO_DATE', 'ON DUPLICATE KEY' => 'MySQL/MariaDB-specific',
        'insertOrIgnore', 'upsert' => 'MySQL/MariaDB upsert (Laravel abstracts)',
        'DB::raw', 'selectRaw', 'whereRaw', 'orderByRaw', 'havingRaw', 'groupByRaw', 'joinRaw' => 'Unknown / requires execution',
        'IFNULL', 'COALESCE', 'LOWER(', 'FOR UPDATE', 'LOCK IN SHARE MODE' => 'Portable (mostly)',
        default => 'Unknown / requires execution',
    };
}

$summary = [];
foreach ($findings as $f) {
    $summary[$f['classification']] = ($summary[$f['classification']] ?? 0) + 1;
}

$result = [
    'timestamp_utc' => gmdate('c'),
    'files_scanned' => count(array_unique(array_column($findings, 'file'))),
    'finding_count' => count($findings),
    'by_classification' => $summary,
    'mysql_specific_files' => array_values(array_unique(array_map(
        fn ($f) => $f['file'],
        array_filter($findings, fn ($f) => in_array($f['classification'], ['MySQL/MariaDB-specific', 'MySQL/MariaDB upsert (Laravel abstracts)'], true))
    ))),
    'findings_sample' => array_slice($findings, 0, 50),
    'postgresql_migration_decision' => 'REJECTED FOR CURRENT STAGE',
];

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
