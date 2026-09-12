<?php

declare(strict_types=1);

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$rows = DB::table('products as p')
    ->join('vendor_accounts as v', 'v.id', '=', 'p.vendor_account_id')
    ->select('p.id', 'p.name', 'p.slug', 'p.created_at', 'v.business_name', 'v.id as vendor_id')
    ->orderBy('p.created_at')
    ->get();

echo json_encode($rows, JSON_PRETTY_PRINT).PHP_EOL;
