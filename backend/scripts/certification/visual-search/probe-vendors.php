<?php

declare(strict_types=1);

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

echo json_encode([
    'vendors' => DB::table('vendor_accounts')->select('id', 'status', 'business_name')->get(),
    'categories' => DB::table('categories')->select('id', 'slug')->limit(5)->get(),
    'users' => DB::table('users')->count(),
], JSON_PRETTY_PRINT).PHP_EOL;
