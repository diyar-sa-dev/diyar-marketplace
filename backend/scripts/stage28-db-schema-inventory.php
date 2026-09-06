<?php

declare(strict_types=1);

/**
 * Stage 28.2 — Schema inventory scoped to configured database (read-only).
 * Usage: php scripts/stage28-db-schema-inventory.php [--output=path.json]
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$driver = config('database.default');
$schema = config("database.connections.{$driver}.database");

$domains = [
    'users' => ['users', 'roles', 'role_user', 'personal_access_tokens', 'addresses', 'email_verification_tokens'],
    'vendors' => ['vendor_accounts', 'vendor_team_members', 'vendor_coupons', 'commission_rules', 'vendor_payouts'],
    'catalog' => ['categories', 'products', 'product_colors', 'product_images', 'product_inventory', 'product_reviews', 'media_files'],
    'cart' => ['carts', 'cart_items'],
    'orders' => ['orders', 'order_items', 'vendor_orders', 'shipments'],
    'payments' => ['payments', 'payment_attempts', 'payment_webhook_events', 'payment_vendor_allocations', 'financial_transactions'],
    'returns' => ['return_requests', 'return_items', 'refunds', 'vendor_return_policies'],
    'services' => ['services', 'service_bookings', 'service_rfqs', 'service_rfq_offers', 'provider_reviews'],
    'reviews' => ['product_reviews', 'store_reviews', 'provider_reviews', 'b2b_company_reviews'],
    'coupons' => ['vendor_coupons', 'coupon_redemptions'],
    'notifications' => ['notifications', 'notification_deliveries', 'notification_broadcasts'],
    'chat' => ['conversations', 'conversation_participants', 'messages', 'message_attachments'],
    'affiliate' => ['affiliate_accounts', 'affiliate_links', 'affiliate_commissions', 'affiliate_payouts'],
    'b2b' => ['b2b_companies', 'b2b_company_portfolio_images', 'b2b_rfqs'],
    'loyalty' => ['loyalty_accounts', 'loyalty_transactions'],
    'analytics' => ['analytics_events', 'search_query_events'],
    'admin' => ['admin_permissions', 'admin_role_permissions', 'admin_audit_logs', 'system_settings'],
    'cms' => ['blog_articles', 'blog_categories', 'projects', 'blog_wishlist_items'],
    'shipping' => ['shipping_carriers', 'shipping_zones', 'shipping_methods', 'shipping_rate_rules', 'vendor_shipping_settings', 'vendor_shipping_profiles'],
];

$result = [
    'timestamp_utc' => gmdate('c'),
    'schema' => $schema,
    'driver' => $driver,
    'migration_files' => count(glob(database_path('migrations/*.php')) ?: []),
    'domains' => [],
    'summary' => [
        'total_tables' => 0,
        'total_foreign_keys' => 0,
        'total_indexes' => 0,
    ],
];

$allTables = DB::select(
    'SELECT TABLE_NAME, ENGINE, TABLE_COLLATION, TABLE_ROWS, ROUND((DATA_LENGTH + INDEX_LENGTH)/1024/1024, 2) AS size_mb
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME',
    [$schema]
);

$result['summary']['total_tables'] = count($allTables);

foreach ($allTables as $t) {
    $result['tables'][$t->TABLE_NAME] = [
        'engine' => $t->ENGINE,
        'collation' => $t->TABLE_COLLATION,
        'approx_rows' => (int) $t->TABLE_ROWS,
        'size_mb' => (float) $t->size_mb,
    ];
}

$fks = DB::select(
    'SELECT kcu.CONSTRAINT_NAME, kcu.TABLE_NAME, kcu.COLUMN_NAME, kcu.REFERENCED_TABLE_NAME, kcu.REFERENCED_COLUMN_NAME,
            rc.DELETE_RULE, rc.UPDATE_RULE
     FROM information_schema.KEY_COLUMN_USAGE kcu
     LEFT JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
       ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
     WHERE kcu.TABLE_SCHEMA = ? AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
     ORDER BY kcu.TABLE_NAME, kcu.CONSTRAINT_NAME',
    [$schema]
);
$result['summary']['total_foreign_keys'] = count($fks);
$result['foreign_keys'] = array_map(fn ($r) => (array) $r, $fks);

$indexes = DB::select(
    'SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ?
     GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE
     ORDER BY TABLE_NAME, INDEX_NAME',
    [$schema]
);
$result['summary']['total_indexes'] = count($indexes);

foreach ($domains as $domain => $expectedTables) {
    $domainInfo = ['expected' => [], 'missing' => []];
    foreach ($expectedTables as $table) {
        $exists = isset($result['tables'][$table]);
        $domainInfo['expected'][$table] = $exists;
        if (! $exists) {
            $domainInfo['missing'][] = $table;
        }
    }
    $result['domains'][$domain] = $domainInfo;
}

// Largest tables
$bySize = $result['tables'];
uasort($bySize, fn ($a, $b) => ($b['size_mb'] <=> $a['size_mb']));
$result['largest_tables_by_size_mb'] = array_slice(array_map(
    fn ($name, $meta) => ['table' => $name, 'size_mb' => $meta['size_mb'], 'approx_rows' => $meta['approx_rows']],
    array_keys($bySize),
    array_values($bySize)
), 0, 15);

$outputArg = null;
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--output=')) {
        $outputArg = substr($arg, 9);
    }
}

$json = json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
if ($outputArg) {
    file_put_contents($outputArg, $json);
    echo "Wrote schema inventory to {$outputArg}".PHP_EOL;
} else {
    echo $json.PHP_EOL;
}
