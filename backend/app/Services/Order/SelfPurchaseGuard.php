<?php

namespace App\Services\Order;

use App\Models\Product;
use App\Models\User;
use App\Support\Vendor\VendorOwnership;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final class SelfPurchaseGuard
{
    public function __construct(
        private readonly VendorOwnership $vendorOwnership,
    ) {}

    public function userOwnsProduct(User $user, Product $product): bool
    {
        return $this->vendorOwnership->userOwnsProduct($user, $product);
    }

    /**
     * @param  iterable<int, object{product_id: string, product?: Product|null}>  $items
     */
    public function assertCartItemsNotSelfPurchase(User $user, iterable $items): void
    {
        foreach ($items as $item) {
            $product = $item->product ?? Product::query()->find($item->product_id);

            if ($product !== null && $this->userOwnsProduct($user, $product)) {
                throw new AccessDeniedHttpException(__('diyar.checkout.self_purchase_forbidden'));
            }
        }
    }

    public function assertProductNotSelfPurchase(User $user, Product $product): void
    {
        if ($this->userOwnsProduct($user, $product)) {
            throw new AccessDeniedHttpException(__('diyar.checkout.self_purchase_forbidden'));
        }
    }
}
