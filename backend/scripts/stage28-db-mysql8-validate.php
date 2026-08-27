<?php

declare(strict_types=1);

/**
 * Stage 28.2 — MySQL 8 migration + seed validation (isolated staging DB).
 * Usage: php scripts/stage28-db-mysql8-validate.php
 *
 * Expects docker-compose.staging.yml MySQL on 127.0.0.1:3307
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

require __DIR__.'/../vendor/autoload.php';

$host = getenv('STAGE28_MYSQL8_HOST') ?: '127.0.0.1';
$port = getenv('STAGE28_MYSQL8_PORT') ?: '3307';
$database = getenv('STAGE28_MYSQL8_DATABASE') ?: 'diyar_staging';
$username = getenv('STAGE28_MYSQL8_USERNAME') ?: 'diyar_staging';
$password = getenv('STAGE28_MYSQL8_PASSWORD') ?: 'staging_secret';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$config = $app->make('config');
$config->set('database.default', 'mysql');
$config->set('database.connections.mysql.host', $host);
$config->set('database.connections.mysql.port', $port);
$config->set('database.connections.mysql.database', $database);
$config->set('database.connections.mysql.username', $username);
$config->set('database.connections.mysql.password', $password);
DB::purge('mysql');

$result = [
    'timestamp_utc' => gmdate('c'),
    'target' => compact('host', 'port', 'database', 'username'),
    'steps' => [],
];

function step8(array &$result, string $name, callable $fn): void
{
    $started = microtime(true);
    try {
        $out = $fn();
        $result['steps'][$name] = [
            'status' => 'PASS',
            'duration_ms' => round((microtime(true) - $started) * 1000, 2),
            'detail' => $out,
        ];
    } catch (Throwable $e) {
        $result['steps'][$name] = [
            'status' => 'FAIL',
            'duration_ms' => round((microtime(true) - $started) * 1000, 2),
            'error' => $e->getMessage(),
        ];
    }
}

step8($result, 'connect', function () {
    $version = DB::selectOne('SELECT VERSION() AS version');

    return ['version' => $version->version ?? null];
});

step8($result, 'migrate_fresh', function () {
    Artisan::call('migrate:fresh', ['--force' => true]);

    return [
        'output_tail' => trim(substr(Artisan::output(), -500)),
        'tables' => count(Schema::getTableListing()),
        'migrations' => (int) DB::table('migrations')->count(),
    ];
});

step8($result, 'seed', function () {
    Artisan::call('db:seed', ['--force' => true]);

    return [
        'users' => Schema::hasTable('users') ? (int) DB::table('users')->count() : null,
        'products' => Schema::hasTable('products') ? (int) DB::table('products')->count() : null,
        'categories' => Schema::hasTable('categories') ? (int) DB::table('categories')->count() : null,
    ];
});

step8($result, 'json_column_roundtrip', function () {
    if (! Schema::hasTable('system_settings')) {
        return ['skipped' => true];
    }
    DB::table('system_settings')->updateOrInsert(
        ['key' => 'stage28_json_probe'],
        ['value' => json_encode(['probe' => true, 'nested' => ['a' => 1]]), 'updated_at' => now(), 'created_at' => now()]
    );
    $row = DB::table('system_settings')->where('key', 'stage28_json_probe')->first();
    $decoded = json_decode($row->value ?? '{}', true);

    return ['stored' => $decoded, 'pass' => ($decoded['probe'] ?? false) === true];
});

$result['overall'] = collect($result['steps'])->every(fn ($s) => ($s['status'] ?? '') === 'PASS') ? 'PASS' : 'FAIL';

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;
