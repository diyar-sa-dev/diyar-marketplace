<?php

declare(strict_types=1);

/**
 * MySQL backup + restore verification inside Docker multinode stack.
 *
 * Usage (inside api container):
 *   php scripts/stage2817-mysql-backup-restore.php
 */

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

if (DB::getDriverName() !== 'mysql') {
    echo "SKIP: requires MySQL\n";
    exit(0);
}

$backupPath = storage_path('app/certification-backup-'.date('YmdHis').'.sql');
$start = microtime(true);

echo "=== MySQL backup/restore certification ===\n";

$tables = ['users', 'orders', 'products', 'payments'];
$before = [];
foreach ($tables as $table) {
    $before[$table] = Schema::hasTable($table) ? (int) DB::table($table)->count() : 0;
}

$host = (string) config('database.connections.mysql.host');
$user = (string) config('database.connections.mysql.username');
$pass = (string) config('database.connections.mysql.password');
$db = (string) config('database.connections.mysql.database');

$cmd = sprintf(
    'mysqldump -h%s -u%s -p%s %s > %s 2>&1',
    escapeshellarg($host),
    escapeshellarg($user),
    escapeshellarg($pass),
    escapeshellarg($db),
    escapeshellarg($backupPath),
);

exec($cmd, $dumpOut, $dumpCode);

if ($dumpCode !== 0 || ! is_readable($backupPath) || filesize($backupPath) < 100) {
    echo "BACKUP FAIL code={$dumpCode}\n";
    echo implode("\n", $dumpOut)."\n";
    exit(1);
}

$backupSize = filesize($backupPath);
$backupMs = (int) round((microtime(true) - $start) * 1000);
echo "backup: size={$backupSize} bytes duration_ms={$backupMs}\n";

$restoreStart = microtime(true);
Artisan::call('migrate:fresh', ['--force' => true, '--seed' => true]);
$freshMs = (int) round((microtime(true) - $restoreStart) * 1000);
echo "migrate:fresh --seed duration_ms={$freshMs}\n";

$restoreCmd = sprintf(
    'mysql -h%s -u%s -p%s %s < %s 2>&1',
    escapeshellarg($host),
    escapeshellarg($user),
    escapeshellarg($pass),
    escapeshellarg($db),
    escapeshellarg($backupPath),
);

exec($restoreCmd, $restoreOut, $restoreCode);
$restoreMs = (int) round((microtime(true) - $restoreStart) * 1000);

if ($restoreCode !== 0) {
    echo "RESTORE FAIL code={$restoreCode}\n";
    echo implode("\n", $restoreOut)."\n";
    exit(1);
}

$after = [];
$match = true;
foreach ($tables as $table) {
    $after[$table] = Schema::hasTable($table) ? (int) DB::table($table)->count() : 0;
    echo "{$table}: before={$before[$table]} after={$after[$table]}\n";
    if ($after[$table] < $before[$table]) {
        $match = false;
    }
}

@unlink($backupPath);

echo "restore_duration_ms={$restoreMs}\n";
echo $match ? "RESULT: PASS\n" : "RESULT: FAIL (row count regression)\n";
exit($match ? 0 : 1);
