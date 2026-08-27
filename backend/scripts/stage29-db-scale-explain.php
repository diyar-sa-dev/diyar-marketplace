<?php

declare(strict_types=1);

/**
 * Stage 28.9 deep pass — EXPLAIN + offset pagination scale probes.
 * Usage: php scripts/stage29-db-scale-explain.php [--label=after] [--output=path.json]
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$label = 'scale';
$output = null;
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--label=')) {
        $label = substr($arg, 8);
    }
    if (str_starts_with($arg, '--output=')) {
        $output = substr($arg, 9);
    }
}

if (config('database.default') === 'sqlite') {
    echo json_encode(['skipped' => true, 'reason' => 'requires mysql'], JSON_PRETTY_PRINT).PHP_EOL;
    exit(0);
}

function explainQuery(string $sql, array $bindings = []): array
{
    $entry = ['sql' => $sql, 'bindings' => $bindings];
    try {
        $entry['explain'] = DB::select('EXPLAIN '.$sql, $bindings);
    } catch (Throwable $e) {
        $entry['explain_error'] = $e->getMessage();
    }
    try {
        $entry['explain_analyze'] = array_map(
            fn ($r) => (array) $r,
            DB::select('EXPLAIN ANALYZE '.$sql, $bindings)
        );
    } catch (Throwable $e) {
        $entry['explain_analyze_error'] = $e->getMessage();
    }

    return $entry;
}

$active = 'active';
$sampleCategory = DB::table('products')->whereNotNull('category_id')->value('category_id')
    ?? '00000000-0000-0000-0000-000000000001';
$sampleVendor = DB::table('products')->whereNotNull('vendor_account_id')->value('vendor_account_id')
    ?? '00000000-0000-0000-0000-000000000001';
$sampleUser = DB::table('orders')->whereNotNull('user_id')->value('user_id')
    ?? '00000000-0000-0000-0000-000000000001';

$offsets = [0, 180, 980, 4980];
$perPage = 20;

$queries = [];

foreach ($offsets as $offset) {
    $queries["products_public_offset_{$offset}"] = explainQuery(
        'SELECT id FROM products WHERE status = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [$active, $perPage, $offset]
    );
    $queries["orders_admin_offset_{$offset}"] = explainQuery(
        'SELECT id FROM orders ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [$perPage, $offset]
    );
    $queries["orders_user_offset_{$offset}"] = explainQuery(
        'SELECT id FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [$sampleUser, $perPage, $offset]
    );
}

$queries['products_category_list'] = explainQuery(
    'SELECT id FROM products WHERE category_id = ? AND status = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 20',
    [$sampleCategory, $active]
);
$queries['products_vendor_list'] = explainQuery(
    'SELECT id FROM products WHERE vendor_account_id = ? AND status = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 20',
    [$sampleVendor, $active]
);
$queries['orders_admin_status'] = explainQuery(
    'SELECT id FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT 20',
    ['pending']
);
$queries['messages_conversation'] = explainQuery(
    'SELECT id FROM messages WHERE conversation_id = ? ORDER BY created_at DESC, id DESC LIMIT 30',
    [DB::table('messages')->value('conversation_id') ?? '00000000-0000-0000-0000-000000000001']
);
$queries['user_notifications'] = explainQuery(
    'SELECT id FROM user_notifications WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 20',
    [$sampleUser]
);

$result = [
    'label' => $label,
    'timestamp_utc' => gmdate('c'),
    'engine' => DB::selectOne('SELECT VERSION() AS v')?->v,
    'row_counts' => [
        'products' => (int) DB::table('products')->count(),
        'orders' => (int) DB::table('orders')->count(),
        'messages' => (int) DB::table('messages')->count(),
        'user_notifications' => (int) DB::table('user_notifications')->count(),
    ],
    'queries' => $queries,
];

$json = json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
if ($output !== null) {
    Illuminate\Support\Facades\File::ensureDirectoryExists(dirname($output));
    Illuminate\Support\Facades\File::put($output, $json);
}
echo $json.PHP_EOL;
