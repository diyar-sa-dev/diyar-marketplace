<?php

declare(strict_types=1);

use App\Jobs\Search\RemoveVisualIndexEntryJob;
use App\Models\Product;
use App\Models\ProductImage;

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$catalogIds = Product::query()
    ->where('slug', 'not like', 'restored-%')
    ->pluck('id');

$removed = 0;
foreach (ProductImage::query()->whereIn('product_id', $catalogIds)->get() as $pi) {
    RemoveVisualIndexEntryJob::dispatchSync($pi->id);
    $pi->delete();
    $removed++;
}

echo json_encode([
    'removed_from_demo_catalog' => $removed,
    'remaining_images' => ProductImage::query()->count(),
    'active_index' => \App\Models\VisualIndexEntry::query()->where('is_active', true)->count(),
], JSON_PRETTY_PRINT).PHP_EOL;
