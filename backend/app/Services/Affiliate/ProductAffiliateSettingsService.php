<?php

namespace App\Services\Affiliate;

use App\Models\Product;
use App\Models\ProductAffiliateSetting;
use App\Models\User;
use App\Services\Catalog\ProductService;
use InvalidArgumentException;

final class ProductAffiliateSettingsService
{
    public function __construct(
        private readonly AffiliateCommissionRules $rules,
        private readonly ProductService $products,
    ) {}

    public function getForProduct(Product $product): ?ProductAffiliateSetting
    {
        return ProductAffiliateSetting::query()
            ->where('product_id', $product->id)
            ->first();
    }

    /**
     * @param  array{enabled?: bool, commission_min_percent: float, commission_max_percent: float, commission_rate_percent?: float}  $payload
     */
    public function upsertForVendorProduct(User $user, Product $product, array $payload): ProductAffiliateSetting
    {
        $owned = $this->products->findOwnedProduct($user, $product->id);

        $min = (float) $payload['commission_min_percent'];
        $max = (float) $payload['commission_max_percent'];
        $this->rules->assertVendorRange($min, $max);

        $enabled = (bool) ($payload['enabled'] ?? false);
        $rate = isset($payload['commission_rate_percent'])
            ? (float) $payload['commission_rate_percent']
            : $this->rules->defaultRateForProduct($min, $max);

        $this->rules->assertRateWithinRange($rate, $min, $max);

        return ProductAffiliateSetting::query()->updateOrCreate(
            ['product_id' => $owned->id],
            [
                'enabled' => $enabled,
                'commission_min_percent' => number_format($min, 2, '.', ''),
                'commission_max_percent' => number_format($max, 2, '.', ''),
                'commission_rate_percent' => number_format($rate, 2, '.', ''),
            ],
        );
    }

    public function assertAffiliateEnabled(Product $product): ProductAffiliateSetting
    {
        $setting = $this->getForProduct($product);

        if ($setting === null || ! $setting->enabled) {
            throw new InvalidArgumentException(__('diyar.affiliate.product_not_enabled'));
        }

        return $setting;
    }
}
