<?php

namespace App\Services\Cart;

use App\Enums\AvailabilityMode;
use App\Enums\CartStatus;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class CartMergeService
{
    public function __construct(
        private readonly CartService $cartService,
    ) {}

    /**
     * @return array{cart: Cart, warnings: list<string>}
     */
    public function mergeGuestIntoUser(User $user, string $guestSessionId): array
    {
        $warnings = [];

        return DB::transaction(function () use ($user, $guestSessionId, &$warnings) {
            $userCart = $this->cartService->resolveForUser($user);

            $guestCart = Cart::query()
                ->whereNull('user_id')
                ->where('session_id', $guestSessionId)
                ->where('status', CartStatus::Active)
                ->lockForUpdate()
                ->first();

            if ($guestCart === null || $guestCart->items()->count() === 0) {
                return [
                    'cart' => $this->cartService->loadCart($userCart),
                    'warnings' => $warnings,
                ];
            }

            $guestCart->load(['items.product.inventory']);

            Cart::query()->whereKey($userCart->id)->lockForUpdate()->firstOrFail();

            foreach ($guestCart->items as $guestItem) {
                $product = $guestItem->product;
                $requested = $guestItem->quantity;

                $userItem = CartItem::query()
                    ->where('cart_id', $userCart->id)
                    ->where('product_id', $guestItem->product_id)
                    ->where('color_name', $guestItem->color_name)
                    ->lockForUpdate()
                    ->first();

                $combined = $requested + ($userItem?->quantity ?? 0);
                $combined = min($combined, $this->cartService->maxQuantityPerItem());

                if ($product !== null && $product->availability_mode === AvailabilityMode::InStock) {
                    $available = $product->inventory?->available_quantity ?? 0;
                    if ($combined > $available) {
                        $warnings[] = __('diyar.cart.merge_quantity_capped', [
                            'product' => $product->name,
                            'available' => $available,
                        ]);
                        $combined = min($combined, max(0, $available));
                    }
                }

                if ($combined < 1) {
                    continue;
                }

                $unitPrice = $product !== null
                    ? (string) $product->sale_price
                    : (string) $guestItem->unit_price_snapshot;

                if ($userItem !== null) {
                    $userItem->update([
                        'quantity' => $combined,
                        'unit_price_snapshot' => $unitPrice,
                        'color_hex' => $guestItem->color_hex ?? $userItem->color_hex,
                    ]);
                } else {
                    CartItem::query()->create([
                        'cart_id' => $userCart->id,
                        'product_id' => $guestItem->product_id,
                        'quantity' => $combined,
                        'unit_price_snapshot' => $unitPrice,
                        'color_name' => $guestItem->color_name,
                        'color_hex' => $guestItem->color_hex,
                    ]);
                }
            }

            $guestCart->update([
                'status' => CartStatus::Merged,
                'merged_at' => now(),
            ]);

            return [
                'cart' => $this->cartService->loadCart($userCart->fresh()),
                'warnings' => $warnings,
            ];
        });
    }
}
