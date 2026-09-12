<?php

declare(strict_types=1);

use App\Models\VisualIndexEntry;
use App\Services\Search\Visual\VisualIndexingService;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$indexVersion = (string) config('diyar.visual_search.index_version');
$groups = DB::table('visual_index_entries')
    ->select('hash_bits', DB::raw('COUNT(*) as cnt'))
    ->where('is_active', true)
    ->where('index_version', $indexVersion)
    ->groupBy('hash_bits')
    ->having('cnt', '>', 1)
    ->get();

$deactivated = [];
$indexing = app(VisualIndexingService::class);

foreach ($groups as $group) {
    $entries = VisualIndexEntry::query()
        ->where('hash_bits', $group->hash_bits)
        ->where('is_active', true)
        ->where('index_version', $indexVersion)
        ->orderBy('product_id')
        ->get();

    foreach ($entries->slice(1) as $entry) {
        $indexing->deactivateForProductImage($entry->product_image_id);
        $deactivated[] = [
            'product_image_id' => $entry->product_image_id,
            'product_id' => $entry->product_id,
            'hash_bits' => bin2hex($entry->hash_bits),
        ];
    }
}

echo json_encode([
    'duplicate_groups' => $groups->count(),
    'deactivated' => count($deactivated),
    'active_after' => VisualIndexEntry::query()->where('is_active', true)->count(),
], JSON_PRETTY_PRINT).PHP_EOL;
