<?php

declare(strict_types=1);

/**
 * Stage 28.9 deep pass — schema, index, FK, redundancy, and table reference audit.
 * Usage: php scripts/stage29-db-deep-audit.php [--output-dir=path]
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$outputDir = dirname(__DIR__, 2).'/conception/Stages/Stage 28/Phase 28.9 - Database Optimization';
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--output-dir=')) {
        $outputDir = substr($arg, 13);
    }
}

$driver = config('database.default');
if ($driver === 'sqlite') {
    fwrite(STDERR, "Deep audit requires MySQL/MariaDB.\n");
    exit(1);
}

$schema = config("database.connections.{$driver}.database");
$repoRoot = dirname(__DIR__, 2);
$searchRoots = [
    $repoRoot.'/backend/app',
    $repoRoot.'/backend/database',
    $repoRoot.'/backend/tests',
    $repoRoot.'/backend/routes',
    $repoRoot.'/backend/scripts',
];

$tables = DB::select(
    'SELECT TABLE_NAME, ENGINE, TABLE_ROWS,
            ROUND(DATA_LENGTH/1024/1024, 3) AS data_mb,
            ROUND(INDEX_LENGTH/1024/1024, 3) AS index_mb,
            TABLE_COMMENT
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME',
    [$schema]
);

$columns = DB::select(
    'SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME, ORDINAL_POSITION',
    [$schema]
);

$indexes = DB::select(
    'SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME, COLLATION, INDEX_TYPE
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX',
    [$schema]
);

$foreignKeys = DB::select(
    'SELECT kcu.TABLE_NAME AS child_table,
            kcu.COLUMN_NAME AS child_column,
            kcu.CONSTRAINT_NAME,
            kcu.REFERENCED_TABLE_NAME AS parent_table,
            kcu.REFERENCED_COLUMN_NAME AS parent_column,
            rc.UPDATE_RULE,
            rc.DELETE_RULE
     FROM information_schema.KEY_COLUMN_USAGE kcu
     JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
       ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
      AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
     WHERE kcu.CONSTRAINT_SCHEMA = ?
       AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
     ORDER BY kcu.TABLE_NAME, kcu.CONSTRAINT_NAME',
    [$schema]
);

$indexesByTable = [];
foreach ($indexes as $idx) {
    $indexesByTable[$idx->TABLE_NAME][$idx->INDEX_NAME][] = [
        'column' => $idx->COLUMN_NAME,
        'seq' => (int) $idx->SEQ_IN_INDEX,
        'non_unique' => (bool) $idx->NON_UNIQUE,
        'type' => $idx->INDEX_TYPE,
    ];
}

$columnsByTable = [];
foreach ($columns as $col) {
    $columnsByTable[$col->TABLE_NAME][] = [
        'name' => $col->COLUMN_NAME,
        'type' => $col->COLUMN_TYPE,
        'nullable' => $col->IS_NULLABLE === 'YES',
        'key' => $col->COLUMN_KEY,
        'default' => $col->COLUMN_DEFAULT,
        'extra' => $col->EXTRA,
    ];
}

/** @var array<string, list<string>> $indexColumnsOnly */
$indexColumnsOnly = [];
foreach ($indexesByTable as $table => $tableIndexes) {
    foreach ($tableIndexes as $name => $parts) {
        usort($parts, fn ($a, $b) => $a['seq'] <=> $b['seq']);
        $indexColumnsOnly[$table][$name] = array_map(fn ($p) => $p['column'], $parts);
    }
}

/** Detect prefix-redundant indexes (heuristic — DEFER removal unless proven). */
$redundantCandidates = [];
foreach ($indexColumnsOnly as $table => $tableIndexes) {
    $names = array_keys($tableIndexes);
    foreach ($names as $a) {
        foreach ($names as $b) {
            if ($a === $b) {
                continue;
            }
            $colsA = $indexColumnsOnly[$table][$a];
            $colsB = $indexColumnsOnly[$table][$b];
            if (count($colsA) >= count($colsB)) {
                continue;
            }
            $isPrefix = array_slice($colsB, 0, count($colsA)) === $colsA;
            if ($isPrefix && $a !== 'PRIMARY') {
                $redundantCandidates[] = [
                    'id' => 'INDEX-'.strtoupper(Str::slug($table.'-'.$a, '_')),
                    'table' => $table,
                    'shorter_index' => $a,
                    'shorter_columns' => $colsA,
                    'longer_index' => $b,
                    'longer_columns' => $colsB,
                    'decision' => 'INVESTIGATE',
                    'note' => 'Prefix overlap — verify query plans before drop',
                ];
            }
        }
    }
}

/** FK child-side index coverage. */
$fkAudit = [];
foreach ($foreignKeys as $fk) {
    $childTable = $fk->child_table;
    $childColumn = $fk->child_column;
    $indexed = false;
    $coveringIndex = null;
    foreach ($indexColumnsOnly[$childTable] ?? [] as $indexName => $cols) {
        if (($cols[0] ?? null) === $childColumn) {
            $indexed = true;
            $coveringIndex = $indexName;
            break;
        }
    }
    $fkAudit[] = [
        'child_table' => $childTable,
        'child_column' => $childColumn,
        'parent_table' => $fk->parent_table,
        'parent_column' => $fk->parent_column,
        'on_delete' => $fk->DELETE_RULE,
        'on_update' => $fk->UPDATE_RULE,
        'child_indexed' => $indexed,
        'covering_index' => $coveringIndex,
    ];
}

$unindexedFks = array_values(array_filter($fkAudit, fn ($f) => ! $f['child_indexed']));

/** Table reference scan (code mentions). */
$tableRefs = [];
foreach ($tables as $t) {
    $name = $t->TABLE_NAME;
    $patterns = [
        "'{$name}'",
        "\"{$name}\"",
        "`{$name}`",
        "->{$name}",
        "table('{$name}')",
        "from('{$name}')",
        "FROM {$name}",
        "INTO {$name}",
    ];
    $hits = [];
    foreach ($searchRoots as $root) {
        if (! File::isDirectory($root)) {
            continue;
        }
        foreach (File::allFiles($root) as $file) {
            if (! in_array($file->getExtension(), ['php', 'sql', 'md'], true)) {
                continue;
            }
            $content = File::get($file->getPathname());
            foreach ($patterns as $pattern) {
                if (str_contains($content, $pattern)) {
                    $rel = str_replace('\\', '/', str_replace($repoRoot.'/', '', $file->getPathname()));
                    $hits[$rel] = ($hits[$rel] ?? 0) + 1;
                    break;
                }
            }
        }
    }
    $tableRefs[$name] = [
        'reference_files' => count($hits),
        'sample_files' => array_slice(array_keys($hits), 0, 5),
    ];
}

$domainMap = [
    'IDENTITY' => ['users', 'roles', 'role_user', 'personal_access_tokens', 'addresses', 'password_reset_tokens'],
    'VENDORS' => ['vendor_accounts', 'vendor_team_members', 'vendor_coupons', 'vendor_payouts', 'commission_rules'],
    'CATALOG' => ['categories', 'products', 'product_colors', 'product_images', 'product_inventory', 'product_reviews', 'product_likes', 'media_files'],
    'CART' => ['carts', 'cart_items', 'wishlists', 'wishlist_items'],
    'COMMERCE' => ['orders', 'order_items', 'vendor_orders', 'shipments', 'order_number_sequences'],
    'PAYMENTS' => ['payments', 'payment_attempts', 'payment_webhook_events', 'payment_vendor_allocations', 'financial_transactions'],
    'SHIPPING' => ['shipping_carriers', 'shipping_zones', 'shipping_methods', 'shipping_rate_rules', 'vendor_shipping_settings', 'shipments'],
    'RETURNS' => ['return_requests', 'return_items', 'refunds', 'vendor_return_policies'],
    'SERVICES' => ['services', 'service_bookings', 'service_requests', 'service_offers', 'provider_accounts'],
    'REVIEWS' => ['store_reviews', 'provider_reviews', 'b2b_company_reviews'],
    'COUPONS' => ['vendor_coupons', 'coupon_redemptions'],
    'NOTIFICATIONS' => ['user_notifications', 'notification_deliveries', 'notification_devices', 'notification_broadcasts'],
    'CHAT' => ['conversations', 'conversation_participants', 'messages', 'message_attachments'],
    'AFFILIATE' => ['affiliate_accounts', 'affiliate_links', 'affiliate_commissions', 'affiliate_clicks', 'affiliate_attributions'],
    'LOYALTY' => ['loyalty_accounts', 'loyalty_transactions', 'loyalty_rules'],
    'B2B' => ['b2b_companies', 'b2b_company_portfolio_images', 'b2b_rfqs', 'b2b_leads'],
    'ANALYTICS' => ['analytics_events', 'search_query_events'],
    'FINANCE' => ['vendor_payouts', 'financial_transactions'],
    'ADMIN' => ['admin_audit_logs', 'admin_permissions', 'admin_role_permissions', 'system_settings'],
    'CMS' => ['blog_articles', 'blog_categories', 'projects'],
    'AI' => ['assistant_conversations', 'assistant_messages'],
    'INFRASTRUCTURE' => ['jobs', 'failed_jobs', 'cache', 'cache_locks', 'sessions', 'migrations'],
];

$tableToDomain = [];
foreach ($domainMap as $domain => $names) {
    foreach ($names as $name) {
        $tableToDomain[$name] = $domain;
    }
}

$schemaFinal = [
    'timestamp_utc' => gmdate('c'),
    'schema' => $schema,
    'engine_version' => DB::selectOne('SELECT VERSION() AS v')?->v,
    'summary' => [
        'tables' => count($tables),
        'columns' => count($columns),
        'index_entries' => count($indexes),
        'foreign_keys' => count($foreignKeys),
        'unindexed_foreign_keys' => count($unindexedFks),
        'redundant_index_candidates' => count($redundantCandidates),
    ],
    'tables' => [],
];

foreach ($tables as $t) {
    $name = $t->TABLE_NAME;
    $refs = $tableRefs[$name] ?? ['reference_files' => 0, 'sample_files' => []];
    $domain = $tableToDomain[$name] ?? 'UNKNOWN';
    $rows = (int) ($t->TABLE_ROWS ?? 0);

    $classification = match (true) {
        in_array($name, ['jobs', 'failed_jobs', 'cache', 'cache_locks', 'sessions', 'migrations'], true) => 'LARAVEL_INFRA',
        in_array($name, ['admin_audit_logs', 'analytics_events', 'search_query_events', 'payment_webhook_events'], true) => 'AUDIT',
        str_contains($name, '_permissions') => 'SUPPORTING',
        str_contains($name, 'role_') || str_ends_with($name, '_user') => 'JUNCTION',
        $rows > 10000 => 'HIGH_TRAFFIC',
        $refs['reference_files'] === 0 => 'UNKNOWN',
        default => 'CORE',
    };

    $schemaFinal['tables'][$name] = [
        'domain' => $domain,
        'classification' => $classification,
        'approx_rows' => $rows,
        'data_mb' => (float) ($t->data_mb ?? 0),
        'index_mb' => (float) ($t->index_mb ?? 0),
        'code_references' => $refs['reference_files'],
        'sample_reference_files' => $refs['sample_files'],
        'columns' => $columnsByTable[$name] ?? [],
        'indexes' => $indexColumnsOnly[$name] ?? [],
    ];
}

$indexesFinal = [
    'timestamp_utc' => gmdate('c'),
    'schema' => $schema,
    'indexes_by_table' => $indexColumnsOnly,
    'redundant_candidates' => $redundantCandidates,
];

$fkFinal = [
    'timestamp_utc' => gmdate('c'),
    'schema' => $schema,
    'foreign_keys' => $fkAudit,
    'unindexed_foreign_keys' => $unindexedFks,
];

File::ensureDirectoryExists($outputDir);
File::put($outputDir.'/_db_schema_final.json', json_encode($schemaFinal, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
File::put($outputDir.'/_db_indexes_final.json', json_encode($indexesFinal, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
File::put($outputDir.'/_db_fk_audit.json', json_encode($fkFinal, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

echo json_encode([
    'output_dir' => $outputDir,
    'summary' => $schemaFinal['summary'],
    'unindexed_fk_count' => count($unindexedFks),
    'unknown_tables' => count(array_filter($schemaFinal['tables'], fn ($t) => $t['classification'] === 'UNKNOWN')),
], JSON_PRETTY_PRINT).PHP_EOL;
