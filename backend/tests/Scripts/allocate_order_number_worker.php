<?php

declare(strict_types=1);
use App\Services\Order\OrderNumberService;
use Illuminate\Contracts\Console\Kernel;

$dbPath = getenv('ORDER_NUMBER_TEST_DB');

if ($dbPath === false || $dbPath === '') {
    fwrite(STDERR, "Missing ORDER_NUMBER_TEST_DB environment variable.\n");
    exit(1);
}

putenv('APP_ENV=testing');
putenv('DB_CONNECTION=sqlite');
putenv("DB_DATABASE={$dbPath}");

$_ENV['APP_ENV'] = 'testing';
$_ENV['DB_CONNECTION'] = 'sqlite';
$_ENV['DB_DATABASE'] = $dbPath;

require dirname(__DIR__, 2).'/vendor/autoload.php';

$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

echo app(OrderNumberService::class)->allocate();
