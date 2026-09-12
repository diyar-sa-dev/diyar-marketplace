<?php

declare(strict_types=1);

/**
 * Phase 3 SQL EXPLAIN spike — creates TEMP table only, NOT production schema.
 *
 * Usage: php backend/scripts/benchmark/visual-search/run-sql-explain.php
 */

require __DIR__.'/lib/VisualHash.php';

$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$database = getenv('DB_DATABASE') ?: 'diyar_production_local';
$username = getenv('DB_USERNAME') ?: 'diyar';
$password = getenv('DB_PASSWORD') ?: 'prodlocal_secret';

$dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $database);
$pdo = new PDO($dsn, $username, $password, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

$table = 'tmp_visual_index_phase3';
$indexVersion = 'catalog-phase3-bench';

$pdo->exec('DROP TABLE IF EXISTS '.$table);
$pdo->exec(<<<SQL
CREATE TEMPORARY TABLE {$table} (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    product_image_id CHAR(36) NOT NULL,
    hash_bits BINARY(8) NOT NULL,
    hash_bucket SMALLINT UNSIGNED NOT NULL,
    index_version VARCHAR(64) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    INDEX idx_visual_index_bucket_active (hash_bucket, is_active, index_version)
) ENGINE=InnoDB
SQL);

$rowCount = 50_000;
$insert = $pdo->prepare("INSERT INTO {$table} (id, product_id, product_image_id, hash_bits, hash_bucket, index_version, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)");

$pdo->beginTransaction();
for ($i = 0; $i < $rowCount; $i++) {
    $bits = random_bytes(8);
    $bucket = VisualHash::bucketFromHashBits($bits);
    $insert->execute([
        sprintf('00000000-0000-4000-8000-%012d', $i),
        sprintf('10000000-0000-4000-8000-%012d', (int) floor($i / 5)),
        sprintf('20000000-0000-4000-8000-%012d', $i),
        $bits,
        $bucket,
        $indexVersion,
    ]);
}
$pdo->commit();

$queryBucket = random_int(0, 4095);
$neighborBuckets = VisualHash::neighborBuckets($queryBucket, 8);
$placeholders = implode(',', array_fill(0, count($neighborBuckets), '?'));

$sql = <<<SQL
SELECT id, product_id, product_image_id, hash_bits
FROM {$table}
WHERE is_active = 1
  AND index_version = ?
  AND hash_bucket IN ({$placeholders})
LIMIT 500
SQL;

$params = array_merge([$indexVersion], $neighborBuckets);

$explain = $pdo->prepare('EXPLAIN '.$sql);
$explain->execute($params);
$explainRows = $explain->fetchAll(PDO::FETCH_ASSOC);

$analyzeSupported = version_compare($pdo->query('SELECT VERSION()')->fetchColumn(), '8.0.18', '>=');
$analyzeRows = null;
if ($analyzeSupported) {
    $analyze = $pdo->prepare('EXPLAIN ANALYZE '.$sql);
    $analyze->execute($params);
    $analyzeRows = $analyze->fetchAll(PDO::FETCH_ASSOC);
}

$start = hrtime(true);
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$elapsedMs = (hrtime(true) - $start) / 1_000_000;

$output = [
    'generated_at' => gmdate('c'),
    'mysql_version' => $pdo->query('SELECT VERSION()')->fetchColumn(),
    'row_count' => $rowCount,
    'query_bucket' => $queryBucket,
    'neighbor_buckets' => $neighborBuckets,
    'explain' => $explainRows,
    'explain_analyze' => $analyzeRows,
    'rows_returned' => count($rows),
    'execution_ms' => $elapsedMs,
];

$writableRoot = is_writable(__DIR__)
    ? __DIR__
    : rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR).'/diyar-visual-search-benchmark';
$outPath = $writableRoot.'/output/sql-explain-results.json';
if (! is_dir(dirname($outPath))) {
    mkdir(dirname($outPath), 0777, true);
}
file_put_contents($outPath, json_encode($output, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));

echo "SQL EXPLAIN benchmark complete.\n";
echo "Rows returned: ".count($rows)."\n";
echo "Execution ms: ".round($elapsedMs, 3)."\n";
echo "Results: {$outPath}\n";
