<?php

declare(strict_types=1);

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

$orphanIds = [];
$disk = (string) config('diyar_media.disk', 'media');
foreach (Storage::disk($disk)->allDirectories('products') as $dir) {
    $pid = basename($dir);
    if (! DB::table('products')->where('id', $pid)->exists() && Storage::disk($disk)->files($dir) !== []) {
        $orphanIds[] = $pid;
    }
}

$hits = [];
$tables = DB::select('SHOW TABLES');
$db = config('database.connections.mysql.database');
$key = 'Tables_in_'.$db;
foreach ($tables as $row) {
    $table = $row->$key;
    $cols = Schema::getColumnListing($table);
    foreach ($cols as $col) {
        if (! str_contains($col, 'product')) {
            continue;
        }
        foreach ($orphanIds as $pid) {
            $count = DB::table($table)->where($col, $pid)->count();
            if ($count > 0) {
                $hits[] = compact('table', 'col', 'pid', 'count');
            }
        }
    }
}

echo json_encode(['orphan_ids' => $orphanIds, 'hits' => $hits], JSON_PRETTY_PRINT).PHP_EOL;
