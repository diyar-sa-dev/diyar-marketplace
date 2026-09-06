<?php

declare(strict_types=1);

/**
 * Stage 28.9 — Table + index audit for database optimization.
 * Usage: php scripts/stage29-db-table-audit.php [--output=path.json]
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$output = null;
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--output=')) {
        $output = substr($arg, 9);
    }
}

$driver = config('database.default');
$schema = config("database.connections.{$driver}.database");

$domainMap = [
    'users' => ['users', 'roles', 'personal_access_tokens', 'addresses', 'password_reset_tokens'],
    'identity' => ['email_verification_tokens', 'phone_verification_tokens'],
    'catalog' => ['categories', 'products', 'product_colors', 'product_images', 'product_inventory', 'product_reviews', 'product_likes', 'media_files'],
    'cart' => ['carts', 'cart_items'],
    'commerce' => ['orders', 'order_items', 'vendor_orders', 'shipments'],
    'payments' => ['payments', 'payment_attempts', 'payment_webhook_events', 'payment_vendor_allocations', 'financial_transactions'],
    'returns' => ['return_requests', 'return_items', 'refunds', 'vendor_return_policies'],
    'services' => ['services', 'service_bookings', 'provider_reviews'],
    'reviews' => ['store_reviews', 'b2b_company_reviews'],
    'coupons' => ['vendor_coupons', 'coupon_redemptions'],
    'notifications' => ['notifications', 'user_notifications', 'notification_deliveries'],
    'chat' => ['conversations', 'conversation_participants', 'messages'],
    'affiliate' => ['affiliate_accounts', 'affiliate_links', 'affiliate_commissions', 'affiliate_clicks'],
    'loyalty' => ['loyalty_accounts', 'loyalty_transactions'],
    'b2b' => ['b2b_companies', 'b2b_company_portfolio_images', 'b2b_rfqs', 'b2b_leads'],
    'analytics' => ['analytics_events', 'search_query_events'],
    'finance' => ['vendor_payouts', 'commission_rules'],
    'admin' => ['admin_permissions', 'admin_role_permissions', 'admin_audit_logs', 'system_settings'],
    'cms' => ['blog_articles', 'blog_categories', 'projects'],
    'shipping' => ['shipping_carriers', 'shipping_zones', 'shipping_methods', 'shipping_rate_rules', 'vendor_shipping_settings'],
    'assistant' => ['assistant_conversations', 'assistant_messages'],
];

$tableToDomain = [];
foreach ($domainMap as $domain => $tables) {
    foreach ($tables as $table) {
        $tableToDomain[$table] = $domain;
    }
}

$tables = DB::select(
    'SELECT TABLE_NAME, ENGINE, TABLE_ROWS,
            ROUND(DATA_LENGTH/1024/1024, 3) AS data_mb,
            ROUND(INDEX_LENGTH/1024/1024, 3) AS index_mb
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME',
    [$schema]
);

$indexes = DB::select(
    'SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME, COLLATION
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX',
    [$schema]
);

$indexesByTable = [];
foreach ($indexes as $idx) {
    $indexesByTable[$idx->TABLE_NAME][$idx->INDEX_NAME][] = $idx->COLUMN_NAME;
}

$modelsPath = app_path('Models');
$modelFiles = File::exists($modelsPath) ? File::allFiles($modelsPath) : [];
$modelTables = [];
foreach ($modelFiles as $file) {
    $content = File::get($file->getPathname());
    if (preg_match('/protected\s+\$table\s*=\s*[\'"]([^\'"]+)[\'"]/', $content, $m)) {
        $modelTables[$m[1]] = $file->getFilename();
    } elseif (preg_match('/class\s+(\w+)/', $content, $class)) {
        $guessed = Str::snake(Str::pluralStudly($class[1]));
        if (isset($indexesByTable[$guessed]) || collect($tables)->contains(fn ($t) => $t->TABLE_NAME === $guessed)) {
            $modelTables[$guessed] = $file->getFilename();
        }
    }
}

$result = [
    'timestamp_utc' => gmdate('c'),
    'schema' => $schema,
    'driver' => $driver,
    'engine_version' => $driver !== 'sqlite' ? DB::selectOne('SELECT VERSION() AS v')?->v : 'sqlite',
    'summary' => [
        'total_tables' => count($tables),
        'total_index_entries' => count($indexes),
        'domains_mapped' => count($domainMap),
    ],
    'tables' => [],
];

foreach ($tables as $t) {
    $name = $t->TABLE_NAME;
    $domain = $tableToDomain[$name] ?? 'UNKNOWN';
    $classification = match (true) {
        in_array($name, ['admin_audit_logs', 'analytics_events', 'search_query_events', 'payment_webhook_events'], true) => 'AUDIT/HISTORICAL',
        in_array($name, ['jobs', 'failed_jobs', 'cache', 'cache_locks', 'sessions'], true) => 'SUPPORTING',
        str_contains($name, '_permissions') || $name === 'migrations' => 'SUPPORTING',
        ($t->TABLE_ROWS ?? 0) > 10000 => 'ACTIVE-HIGH-TRAFFIC',
        isset($modelTables[$name]) => 'ACTIVE',
        default => 'UNKNOWN',
    };

    $result['tables'][$name] = [
        'domain' => $domain,
        'classification' => $classification,
        'approx_rows' => (int) ($t->TABLE_ROWS ?? 0),
        'data_mb' => (float) ($t->data_mb ?? 0),
        'index_mb' => (float) ($t->index_mb ?? 0),
        'model' => $modelTables[$name] ?? null,
        'indexes' => $indexesByTable[$name] ?? [],
    ];
}

$json = json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
if ($output !== null) {
    File::ensureDirectoryExists(dirname($output));
    File::put($output, $json);
}
echo $json.PHP_EOL;
