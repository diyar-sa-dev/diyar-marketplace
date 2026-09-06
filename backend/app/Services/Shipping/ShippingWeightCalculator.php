<?php

namespace App\Services\Shipping;

use App\Models\Product;
use Illuminate\Support\Collection;
use InvalidArgumentException;

final class ShippingWeightCalculator
{
    public function calculateBillableWeight(
        Collection $cartItems,
        ?int $volumetricDivisor = null,
    ): string {
        $divisor = $volumetricDivisor ?? (int) config('diyar.shipping.default_volumetric_divisor', 5000);
        $maxSupported = (string) config('diyar.shipping.max_supported_weight_kg', '1000');

        if ($divisor <= 0) {
            throw new InvalidArgumentException(__('diyar.shipping.invalid_volumetric_divisor'));
        }

        $totalActual = '0.000';
        $totalVolumetric = '0.000';

        foreach ($cartItems as $item) {
            /** @var Product $product */
            $product = $item->product;
            $qty = (string) max(1, (int) $item->quantity);
            $unitWeight = $this->resolveUnitWeightKg($product);
            $lineActual = bcmul($unitWeight, $qty, 3);
            $totalActual = bcadd($totalActual, $lineActual, 3);

            $volumetric = $this->volumetricWeightKg($product, $divisor);
            if ($volumetric !== null) {
                $lineVolumetric = bcmul($volumetric, $qty, 3);
                $totalVolumetric = bcadd($totalVolumetric, $lineVolumetric, 3);
            }
        }

        $billable = bccomp($totalVolumetric, $totalActual, 3) > 0 ? $totalVolumetric : $totalActual;

        if (bccomp($billable, '0', 3) <= 0) {
            throw new InvalidArgumentException(__('diyar.shipping.missing_weight'));
        }

        if (bccomp($billable, $maxSupported, 3) > 0) {
            throw new InvalidArgumentException(__('diyar.shipping.weight_exceeds_max'));
        }

        return $billable;
    }

    private function resolveUnitWeightKg(Product $product): string
    {
        if ($product->weight_kg !== null && bccomp((string) $product->weight_kg, '0', 3) > 0) {
            return bcadd((string) $product->weight_kg, '0', 3);
        }

        $default = (string) config('diyar.shipping.default_product_weight_kg', '1.000');

        return bcadd($default, '0', 3);
    }

    private function volumetricWeightKg(Product $product, int $divisor): ?string
    {
        $length = $product->depth;
        $width = $product->width;
        $height = $product->height;

        if ($length === null || $width === null || $height === null) {
            return null;
        }

        if (bccomp((string) $length, '0', 2) <= 0
            || bccomp((string) $width, '0', 2) <= 0
            || bccomp((string) $height, '0', 2) <= 0) {
            return null;
        }

        $volume = bcmul(bcmul((string) $length, (string) $width, 4), (string) $height, 4);

        return bcdiv($volume, (string) $divisor, 3);
    }
}
