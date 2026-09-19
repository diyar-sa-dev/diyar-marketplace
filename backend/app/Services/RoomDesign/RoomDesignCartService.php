<?php

namespace App\Services\RoomDesign;

use App\Models\Cart;
use App\Models\Product;
use App\Models\User;
use App\Services\Cart\CartService;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class RoomDesignCartService
{
    public function __construct(
        private readonly RoomDesignDocumentService $designs,
        private readonly CartService $carts,
    ) {}

    /**
     * @param  list<string>|null  $roomItemIds  Design item instance UUIDs; null = all items
     * @return array{cart: Cart, skipped: list<array{product_id: string, reason: string}>}
     */
    public function addDesignToCart(User $user, string $designId, ?array $roomItemIds = null): array
    {
        $design = $this->designs->findOwned($designId, $user);
        $document = $design->document;

        if (! is_array($document) || ! isset($document['items']) || ! is_array($document['items'])) {
            throw ValidationException::withMessages([
                'design' => [__('diyar.room_designer.cart.invalid_document')],
            ]);
        }

        $quantities = $this->aggregateProductQuantities($document['items'], $roomItemIds);

        if ($quantities === []) {
            throw ValidationException::withMessages([
                'design' => [__('diyar.room_designer.cart.empty_selection')],
            ]);
        }

        $productIds = array_keys($quantities);
        $visibleProductIds = Product::query()
            ->publiclyVisible()
            ->whereIn('id', $productIds)
            ->pluck('id')
            ->all();
        $visibleSet = array_fill_keys($visibleProductIds, true);

        $cart = $this->carts->resolveForUser($user);
        $skipped = [];

        foreach ($quantities as $productId => $quantity) {
            if (! isset($visibleSet[$productId])) {
                $skipped[] = ['product_id' => $productId, 'reason' => 'not_found'];

                continue;
            }

            try {
                $cart = $this->carts->addItem($cart, $productId, $quantity);
            } catch (NotFoundHttpException) {
                $skipped[] = ['product_id' => $productId, 'reason' => 'not_found'];
            } catch (InvalidArgumentException) {
                $skipped[] = ['product_id' => $productId, 'reason' => 'out_of_stock'];
            } catch (AccessDeniedHttpException) {
                $skipped[] = ['product_id' => $productId, 'reason' => 'not_allowed'];
            }
        }

        return [
            'cart' => $this->carts->loadCart($cart),
            'skipped' => $skipped,
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $items
     * @param  list<string>|null  $roomItemIds
     * @return array<string, int>
     */
    private function aggregateProductQuantities(array $items, ?array $roomItemIds): array
    {
        $filter = null;
        if ($roomItemIds !== null) {
            $filter = array_fill_keys($roomItemIds, true);
        }

        $quantities = [];

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $instanceId = $item['id'] ?? null;
            if ($filter !== null && (! is_string($instanceId) || ! isset($filter[$instanceId]))) {
                continue;
            }

            $productId = $item['product_id'] ?? null;
            if (! is_string($productId) || ! Str::isUuid($productId)) {
                continue;
            }

            $quantities[$productId] = ($quantities[$productId] ?? 0) + 1;
        }

        return $quantities;
    }
}
