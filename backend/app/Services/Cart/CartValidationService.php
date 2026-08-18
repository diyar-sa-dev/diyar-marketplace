<?php

namespace App\Services\Cart;

use App\Enums\AvailabilityMode;
use App\Enums\ProductStatus;
use App\Enums\VendorAccountStatus;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use App\Services\Order\SelfPurchaseGuard;

final class CartValidationService
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly SelfPurchaseGuard $selfPurchase,
    ) {}

    /**
     * @return array{
     *   valid: bool,
     *   items: list<array<string, mixed>>,
     *   totals: array<string, string|null>
     * }
     */
    public function validate(Cart $cart): array
    {
        $cart = $this->cartService->loadCart($cart);
        $items = [];
        $allValid = true;
        $cartUser = $cart->user_id !== null ? User::query()->find($cart->user_id) : null;

        foreach ($cart->items as $item) {
            $result = $this->validateItem($item, $cartUser);
            if (! $result['valid']) {
                $allValid = false;
            }
            $items[] = $result;
        }

        return [
            'valid' => $allValid,
            'items' => $items,
            'totals' => $this->pendingTotals($cart),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function validateItem(CartItem $item, ?User $cartUser): array
    {
        $product = Product::query()
            ->with(['vendorAccount', 'inventory'])
            ->find($item->product_id);

        $base = [
            'item_id' => $item->id,
            'product_id' => $item->product_id,
            'quantity' => $item->quantity,
            'unit_price_snapshot' => (string) $item->unit_price_snapshot,
            'valid' => true,
            'issues' => [],
        ];

        if ($product === null) {
            return $this->invalid($base, 'product_not_found');
        }

        if ($product->status !== ProductStatus::Active) {
            return $this->invalid($base, 'product_inactive');
        }

        if ($product->vendorAccount === null || $product->vendorAccount->status !== VendorAccountStatus::Active) {
            return $this->invalid($base, 'vendor_inactive');
        }

        if ($cartUser !== null && $this->selfPurchase->userOwnsProduct($cartUser, $product)) {
            return $this->invalid($base, 'self_purchase');
        }

        $currentPrice = (string) $product->sale_price;
        if (bccomp($currentPrice, (string) $item->unit_price_snapshot, 2) !== 0) {
            $base['valid'] = false;
            $base['issues'][] = 'price_changed';
            $base['current_unit_price'] = $currentPrice;
        }

        if ($product->availability_mode === AvailabilityMode::OutOfStock) {
            return $this->invalid($base, 'out_of_stock');
        }

        if ($product->availability_mode === AvailabilityMode::InStock) {
            $available = $product->inventory?->available_quantity ?? 0;
            $base['available_quantity'] = $available;

            if ($item->quantity > $available) {
                $base['valid'] = false;
                $base['issues'][] = 'insufficient_stock';
            }
        }

        if ($product->availability_mode === AvailabilityMode::Preorder) {
            $base['availability_mode'] = 'preorder';
            $base['expected_available_at'] = $product->expected_available_at?->toDateString();
        }

        return $base;
    }

    /**
     * @param  array<string, mixed>  $base
     * @return array<string, mixed>
     */
    private function invalid(array $base, string $issue): array
    {
        $base['valid'] = false;
        $base['issues'][] = $issue;

        return $base;
    }

    /**
     * @return array<string, string|null>
     */
    private function pendingTotals(Cart $cart): array
    {
        return [
            'subtotal' => $this->cartService->calculateSubtotal($cart),
            'discount' => null,
            'shipping' => null,
            'tax' => null,
            'total' => null,
        ];
    }
}
