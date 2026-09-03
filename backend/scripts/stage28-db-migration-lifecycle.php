<?php

declare(strict_types=1);

/**
 * Stage 28.2 — Migration lifecycle on isolated SQLite file (safe, no shared DB impact).
 * Usage: php scripts/stage28-db-migration-lifecycle.php
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$isolatedPath = $app->databasePath('stage28_migration_test.sqlite');
if (file_exists($isolatedPath)) {
    unlink($isolatedPath);
}
touch($isolatedPath);

putenv('APP_ENV=testing');
putenv('DB_CONNECTION=sqlite');
putenv('DB_DATABASE='.$isolatedPath);
putenv('DB_URL=');
$_ENV['DB_CONNECTION'] = 'sqlite';
$_ENV['DB_DATABASE'] = $isolatedPath;
$_ENV['DB_URL'] = '';

$config = $app->make('config');
$config->set('database.default', 'sqlite');
$config->set('database.connections.sqlite.database', $isolatedPath);

$app->make(Kernel::class)->bootstrap();

$result = [
    'timestamp_utc' => gmdate('c'),
    'isolated_database' => $isolatedPath,
    'steps' => [],
];

function step(array &$result, string $name, callable $fn): void
{
    $started = microtime(true);
    try {
        $fn();
        $result['steps'][$name] = [
            'status' => 'PASS',
            'duration_ms' => round((microtime(true) - $started) * 1000, 2),
        ];
    } catch (Throwable $e) {
        $result['steps'][$name] = [
            'status' => 'FAIL',
            'duration_ms' => round((microtime(true) - $started) * 1000, 2),
            'error' => $e->getMessage(),
        ];
    }
}

step($result, 'migrate', function (): void {
    Artisan::call('migrate', ['--force' => true]);
    if (Artisan::output() && str_contains(Artisan::output(), 'FAIL')) {
        throw new RuntimeException(trim(Artisan::output()));
    }
});

$result['post_migrate'] = [
    'table_count' => count(Schema::getTableListing()),
    'migrations_ran' => (int) DB::table('migrations')->count(),
];

step($result, 'migrate_again_idempotent', function (): void {
    Artisan::call('migrate', ['--force' => true]);
});

step($result, 'migrate_fresh', function (): void {
    Artisan::call('migrate:fresh', ['--force' => true]);
});

$result['post_fresh'] = [
    'table_count' => count(Schema::getTableListing()),
    'migrations_ran' => (int) DB::table('migrations')->count(),
];

step($result, 'migrate_fresh_seed', function (): void {
    Artisan::call('migrate:fresh', ['--seed' => true, '--force' => true]);
});

$result['post_seed'] = [
    'users_count' => Schema::hasTable('users') ? (int) DB::table('users')->count() : null,
    'categories_count' => Schema::hasTable('categories') ? (int) DB::table('categories')->count() : null,
];

// Critical tables existence after fresh
$critical = ['users', 'products', 'orders', 'payments', 'carts', 'services', 'b2b_companies', 'loyalty_accounts'];
foreach ($critical as $table) {
    $result['critical_tables'][$table] = Schema::hasTable($table);
}

$result['overall'] = collect($result['steps'])->every(fn ($s) => ($s['status'] ?? '') === 'PASS') ? 'PASS' : 'FAIL';

@unlink($isolatedPath);

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
