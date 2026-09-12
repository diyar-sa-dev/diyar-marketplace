<?php

declare(strict_types=1);

/**
 * Replace placeholder "Restored product …" catalog rows with merchant-facing metadata.
 *
 * Usage:
 *   php scripts/certification/visual-search/enrich-restored-products.php [--dry-run]
 */

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductColor;
use Illuminate\Support\Str;

require __DIR__.'/../../../vendor/autoload.php';
$app = require __DIR__.'/../../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$dryRun = in_array('--dry-run', $argv, true);
$manifestPath = __DIR__.'/restored-product-catalog.json';
$manifest = json_decode((string) file_get_contents($manifestPath), true, 512, JSON_THROW_ON_ERROR);

$updated = [];
$skipped = [];

foreach ($manifest as $productId => $meta) {
    $product = Product::query()->find($productId);
    if ($product === null) {
        $skipped[] = ['product_id' => $productId, 'reason' => 'missing_product'];

        continue;
    }

    if (! str_starts_with((string) $product->name, 'Restored product')) {
        $skipped[] = ['product_id' => $productId, 'reason' => 'already_named', 'name' => $product->name];

        continue;
    }

    $category = Category::query()->where('slug', $meta['category'] ?? 'bedroom')->first();
    if ($category === null) {
        $skipped[] = ['product_id' => $productId, 'reason' => 'missing_category'];

        continue;
    }

    $baseSlug = Str::slug((string) $meta['name']);
    $slug = $baseSlug;
    $suffix = 1;
    while (
        Product::query()
            ->where('vendor_account_id', $product->vendor_account_id)
            ->where('slug', $slug)
            ->where('id', '!=', $product->id)
            ->exists()
    ) {
        $slug = $baseSlug.'-'.$suffix;
        $suffix++;
    }

    $payload = [
        'name' => (string) $meta['name'],
        'slug' => $slug,
        'category_id' => $category->id,
        'description' => (string) ($meta['description'] ?? 'منتج من متجر ديار للأثاث.'),
        'sale_price' => (float) ($meta['sale_price'] ?? 999),
        'compare_price' => $meta['compare_price'] ?? null,
        'promotion_ends_at' => isset($meta['compare_price']) && $meta['compare_price'] !== null
            ? now()->addDays(7)
            : null,
    ];

    if (! $dryRun) {
        $product->fill($payload);
        $product->save();

        if (isset($meta['color']) && is_array($meta['color'])) {
            ProductColor::query()->where('product_id', $product->id)->delete();
            ProductColor::query()->create([
                'product_id' => $product->id,
                'name' => (string) ($meta['color']['name'] ?? 'Default'),
                'hex_code' => (string) ($meta['color']['hex'] ?? '#CCCCCC'),
            ]);
        }
    }

    $updated[] = [
        'product_id' => $productId,
        'name' => $payload['name'],
        'slug' => $payload['slug'],
        'category' => $meta['category'] ?? 'bedroom',
        'sale_price' => $payload['sale_price'],
    ];
}

echo json_encode([
    'dry_run' => $dryRun,
    'updated_count' => count($updated),
    'skipped_count' => count($skipped),
    'updated' => $updated,
    'skipped' => $skipped,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).PHP_EOL;
