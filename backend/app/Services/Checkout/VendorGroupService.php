<?php

namespace App\Services\Checkout;

use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Support\Collection;

final class VendorGroupService
{
    /**
     * @return Collection<string, Collection<int, CartItem>>
     */
    public function groupCartItems(Cart $cart): Collection
    {
        $cart->loadMissing('items.product.vendorAccount');

        return $cart->items->groupBy(function (CartItem $item) {
            return (string) $item->product->vendor_account_id;
        });
    }

    public function lineSubtotal(CartItem $item): string
    {
        return bcmul((string) $item->unit_price_snapshot, (string) $item->quantity, 2);
    }

    /**
     * @param  Collection<int, CartItem>  $items
     */
    public function vendorSubtotal(Collection $items): string
    {
        $total = '0.00';

        foreach ($items as $item) {
            $total = bcadd($total, $this->lineSubtotal($item), 2);
        }

        return $total;
    }
}
