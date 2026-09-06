<?php

declare(strict_types=1);

/**
 * Stage 28.2 — Database environment matrix + isolation audit (read-only on default connection).
 * Usage: php scripts/stage28-db-environment.php
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$driver = config('database.default');
$dbName = config("database.connections.{$driver}.database");
$host = config("database.connections.{$driver}.host");

$result = [
    'timestamp_utc' => gmdate('c'),
    'laravel_default_connection' => $driver,
    'configured_database' => $dbName,
    'configured_host' => $host,
    'engine' => [],
    'isolation' => [],
    'privileges' => [],
    'raw_sql_cross_schema' => [],
];

try {
    $version = DB::selectOne('SELECT VERSION() AS version');
    $result['engine']['version'] = $version->version ?? null;
    $result['engine']['is_mariadb'] = isset($version->version) && stripos((string) $version->version, 'mariadb') !== false;
    $result['engine']['is_mysql'] = isset($version->version) && stripos((string) $version->version, 'mariadb') === false;
} catch (Throwable $e) {
    $result['engine']['error'] = $e->getMessage();
}

try {
    $dbRow = DB::selectOne('SELECT DATABASE() AS db');
    $result['isolation']['current_database'] = $dbRow->db ?? null;
    $result['isolation']['matches_config'] = ($dbRow->db ?? null) === $dbName;
} catch (Throwable $e) {
    $result['isolation']['current_database_error'] = $e->getMessage();
}

try {
    $schemas = DB::select('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA ORDER BY SCHEMA_NAME');
    $schemaNames = array_map(fn ($r) => $r->SCHEMA_NAME, $schemas);
    $result['isolation']['server_schemas'] = $schemaNames;
    $result['isolation']['unrelated_schemas_present'] = array_values(array_filter(
        $schemaNames,
        fn ($s) => ! in_array($s, ['information_schema', 'mysql', 'performance_schema', 'sys', $dbName], true)
    ));
} catch (Throwable $e) {
    $result['isolation']['schemas_error'] = $e->getMessage();
}

try {
    $tablesInDiyar = DB::select(
        'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME',
        [$dbName]
    );
    $result['isolation']['diyar_table_count'] = count($tablesInDiyar);
    $result['isolation']['diyar_tables_sample'] = array_slice(array_map(fn ($r) => $r->TABLE_NAME, $tablesInDiyar), 0, 20);
} catch (Throwable $e) {
    $result['isolation']['diyar_tables_error'] = $e->getMessage();
}

// Cross-schema access probe (read-only)
foreach (['hospital_stock', 'cybercafe_db'] as $foreignSchema) {
    try {
        $count = DB::selectOne(
            'SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
            [$foreignSchema]
        );
        $result['isolation']['foreign_schema_access'][$foreignSchema] = [
            'readable' => true,
            'table_count' => (int) ($count->c ?? 0),
        ];
    } catch (Throwable $e) {
        $result['isolation']['foreign_schema_access'][$foreignSchema] = [
            'readable' => false,
            'error' => $e->getMessage(),
        ];
    }
}

// Privileges for current user
try {
    $grants = DB::select('SHOW GRANTS FOR CURRENT_USER()');
    $grantLines = array_map(fn ($r) => array_values((array) $r)[0] ?? '', $grants);
    $result['privileges']['grants'] = $grantLines;
    $result['privileges']['has_global_all'] = (bool) preg_grep('/GRANT ALL PRIVILEGES ON \*.\*/', $grantLines);
    $result['privileges']['has_create_on_star'] = (bool) preg_grep('/CREATE/', $grantLines);
    $result['privileges']['has_drop_on_star'] = (bool) preg_grep('/DROP/', $grantLines);
} catch (Throwable $e) {
    $result['privileges']['error'] = $e->getMessage();
}

// Search codebase for cross-schema references in migrations (static scan)
$migrationDir = database_path('migrations');
$crossSchemaHits = [];
foreach (glob($migrationDir.'/*.php') ?: [] as $file) {
    $content = file_get_contents($file);
    if ($content && preg_match('/`?(hospital_stock|cybercafe_db)`?\./', $content)) {
        $crossSchemaHits[] = basename($file);
    }
}
$result['raw_sql_cross_schema']['migration_files_referencing_foreign_schemas'] = $crossSchemaHits;

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
