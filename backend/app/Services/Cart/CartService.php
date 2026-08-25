<?php

namespace App\Services\Cart;

use App\Enums\AvailabilityMode;
use App\Enums\CartStatus;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use App\Services\Catalog\ProductService;
use App\Services\Order\SelfPurchaseGuard;
use Illuminate\Contracts\Session\Session;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class CartService
{
    public const GUEST_SESSION_FOR_MERGE_KEY = 'cart.guest_session_id_for_merge';

    public function __construct(
        private readonly ProductService $products,
        private readonly SelfPurchaseGuard $selfPurchase,
    ) {}

    public function maxQuantityPerItem(): int
    {
        return max(1, (int) config('diyar.cart.max_quantity_per_item', 99));
    }

    public function resolveGuestSessionIdForMerge(Session $session): string
    {
        $remembered = $session->get(self::GUEST_SESSION_FOR_MERGE_KEY);

        if (is_string($remembered) && $remembered !== '') {
            return $remembered;
        }

        return (string) $session->getId();
    }

    public function resolveForUser(User $user): Cart
    {
        return DB::transaction(function () use ($user) {
            $cart = Cart::query()
                ->where('user_id', $user->id)
                ->where('status', CartStatus::Active)
                ->lockForUpdate()
                ->first();

            if ($cart !== null) {
                return $cart;
            }

            return Cart::query()->create([
                'user_id' => $user->id,
                'session_id' => null,
                'status' => CartStatus::Active,
            ]);
        });
    }

    public function resolveForGuest(string $sessionId): Cart
    {
        if ($sessionId === '') {
            throw new InvalidArgumentException(__('diyar.cart.invalid_session'));
        }

        return DB::transaction(function () use ($sessionId) {
            $cart = Cart::query()
                ->whereNull('user_id')
                ->where('session_id', $sessionId)
                ->where('status', CartStatus::Active)
                ->lockForUpdate()
                ->first();

            if ($cart !== null) {
                return $cart;
            }

            return Cart::query()->create([
                'user_id' => null,
                'session_id' => $sessionId,
                'status' => CartStatus::Active,
            ]);
        });
    }

    public function loadCart(Cart $cart): Cart
    {
        return $cart->load([
            'items.product.vendorAccount',
            'items.product.category',
            'items.product.images.mediaFile',
            'items.product.inventory',
        ]);
    }

    public function addItem(
        Cart $cart,
        string $productId,
        int $quantity,
        ?string $colorName = null,
        ?string $colorHex = null,
    ): Cart {
        $this->assertCartMutable($cart);
        $quantity = $this->normalizeQuantity($quantity);

        return DB::transaction(function () use ($cart, $productId, $quantity, $colorName, $colorHex) {
            $cart = Cart::query()->whereKey($cart->id)->lockForUpdate()->firstOrFail();
            $product = $this->products->findPublic($productId);
            $product->loadMissing('colors');

            if ($cart->user_id !== null) {
                $cartUser = User::query()->find($cart->user_id);
                if ($cartUser !== null) {
                    $this->selfPurchase->assertProductNotSelfPurchase($cartUser, $product);
                }
            }
            $color = $this->resolveColorSelection($product, $colorName, $colorHex);
            $unitPrice = (string) $product->sale_price;

            $item = CartItem::query()
                ->where('cart_id', $cart->id)
                ->where('product_id', $product->id)
                ->where('color_name', $color['name'])
                ->lockForUpdate()
                ->first();

            if ($item !== null) {
                $newQuantity = min(
                    $item->quantity + $quantity,
                    $this->maxQuantityPerItem(),
                );
                $this->assertQuantityAllowedForProduct($product, $newQuantity);
                $item->update([
                    'quantity' => $newQuantity,
                    'unit_price_snapshot' => $unitPrice,
                    'color_hex' => $color['hex'],
                ]);
            } else {
                $this->assertQuantityAllowedForProduct($product, $quantity);
                CartItem::query()->create([
                    'cart_id' => $cart->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price_snapshot' => $unitPrice,
                    'color_name' => $color['name'],
                    'color_hex' => $color['hex'],
                ]);
            }

            return $this->loadCart($cart->fresh());
        });
    }

    public function updateItemQuantity(Cart $cart, CartItem $item, int $quantity): Cart
    {
        $this->assertCartMutable($cart);
        $this->assertItemOwnership($cart, $item);
        $quantity = $this->normalizeQuantity($quantity);

        return DB::transaction(function () use ($cart, $item, $quantity) {
            Cart::query()->whereKey($cart->id)->lockForUpdate()->firstOrFail();
            $item = CartItem::query()->whereKey($item->id)->lockForUpdate()->firstOrFail();
            $product = Product::query()->with('inventory')->find($item->product_id);

            if ($product === null) {
                throw new NotFoundHttpException(__('diyar.catalog.product_not_found'));
            }

            if ($cart->user_id !== null) {
                $cartUser = User::query()->find($cart->user_id);
                if ($cartUser !== null) {
                    $this->selfPurchase->assertProductNotSelfPurchase($cartUser, $product);
                }
            }

            $this->assertQuantityAllowedForProduct($product, $quantity);

            $item->update([
                'quantity' => $quantity,
                'unit_price_snapshot' => (string) $product->sale_price,
            ]);

            return $this->loadCart($cart->fresh());
        });
    }

    public function removeItem(Cart $cart, CartItem $item): Cart
    {
        $this->assertCartMutable($cart);
        $this->assertItemOwnership($cart, $item);

        return DB::transaction(function () use ($cart, $item) {
            Cart::query()->whereKey($cart->id)->lockForUpdate()->firstOrFail();
            $item->delete();

            return $this->loadCart($cart->fresh());
        });
    }

    public function clear(Cart $cart): Cart
    {
        $this->assertCartMutable($cart);

        return DB::transaction(function () use ($cart) {
            Cart::query()->whereKey($cart->id)->lockForUpdate()->firstOrFail();
            $cart->items()->delete();

            return $this->loadCart($cart->fresh());
        });
    }

    public function findItemForCart(Cart $cart, string $itemId): CartItem
    {
        $item = CartItem::query()->whereKey($itemId)->first();

        if ($item === null || $item->cart_id !== $cart->id) {
            throw new NotFoundHttpException(__('diyar.cart.item_not_found'));
        }

        return $item;
    }

    public function calculateSubtotal(Cart $cart): string
    {
        $total = '0.00';

        foreach ($cart->items as $item) {
            $line = bcmul((string) $item->unit_price_snapshot, (string) $item->quantity, 2);
            $total = bcadd($total, $line, 2);
        }

        return $total;
    }

    public function itemCount(Cart $cart): int
    {
        return (int) $cart->items->sum('quantity');
    }

    private function normalizeQuantity(int $quantity): int
    {
        if ($quantity < 1) {
            throw new InvalidArgumentException(__('diyar.cart.invalid_quantity'));
        }

        if ($quantity > $this->maxQuantityPerItem()) {
            throw new InvalidArgumentException(__('diyar.cart.quantity_exceeds_limit'));
        }

        return $quantity;
    }

    private function assertQuantityAllowedForProduct(Product $product, int $quantity): void
    {
        if ($product->availability_mode === AvailabilityMode::OutOfStock) {
            throw new InvalidArgumentException(__('diyar.catalog.product_out_of_stock'));
        }

        if ($product->availability_mode === AvailabilityMode::InStock) {
            $product->loadMissing('inventory');
            $available = $product->inventory?->available_quantity ?? 0;

            if ($quantity > $available) {
                throw new InvalidArgumentException(__('diyar.cart.insufficient_stock', [
                    'available' => $available,
                ]));
            }
        }
    }

    private function assertCartMutable(Cart $cart): void
    {
        if (! $cart->isActive()) {
            throw new InvalidArgumentException(__('diyar.cart.cart_not_mutable'));
        }
    }

    private function assertItemOwnership(Cart $cart, CartItem $item): void
    {
        if ($item->cart_id !== $cart->id) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }
    }

    /**
     * @return array{name: string, hex: string|null}
     */
    private function resolveColorSelection(Product $product, ?string $colorName, ?string $colorHex): array
    {
        $normalizedName = $colorName !== null ? trim($colorName) : '';

        if ($normalizedName === '') {
            return ['name' => '', 'hex' => null];
        }

        $match = $product->colors->firstWhere('name', $normalizedName);

        if ($match === null) {
            throw new InvalidArgumentException(__('diyar.cart.invalid_color'));
        }

        return [
            'name' => $match->name,
            'hex' => $colorHex ?? $match->hex_code,
        ];
    }
}
