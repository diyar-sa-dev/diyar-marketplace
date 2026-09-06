<?php

declare(strict_types=1);

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

function bootstrapConcurrencyWorker(string $dbPath): void
{
    putenv('APP_ENV=testing');
    putenv('DB_CONNECTION=sqlite');
    putenv('DB_DATABASE='.$dbPath);
    $_ENV['APP_ENV'] = 'testing';
    $_ENV['DB_CONNECTION'] = 'sqlite';
    $_ENV['DB_DATABASE'] = $dbPath;

    require __DIR__.'/../vendor/autoload.php';

    $app = require __DIR__.'/../bootstrap/app.php';
    $app->make(Kernel::class)->bootstrap();

    config([
        'database.default' => 'sqlite',
        'database.connections.sqlite.database' => $dbPath,
        'database.connections.sqlite.busy_timeout' => 5000,
        'database.connections.sqlite.journal_mode' => 'wal',
    ]);
    DB::purge('sqlite');
    DB::reconnect('sqlite');
}

function configureConcurrencySqlite(string $dbPath): void
{
    config([
        'database.default' => 'sqlite',
        'database.connections.sqlite.database' => $dbPath,
        'database.connections.sqlite.busy_timeout' => 5000,
        'database.connections.sqlite.journal_mode' => 'wal',
    ]);
    DB::purge('sqlite');
    DB::reconnect('sqlite');
}
