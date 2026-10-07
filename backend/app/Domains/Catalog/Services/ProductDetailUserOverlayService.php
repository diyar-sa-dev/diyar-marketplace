<?php

namespace App\Domains\Catalog\Services;

use App\Domains\Vendors\Support\VendorAccessResolver;
use App\Enums\AvailabilityMode;
use App\Enums\ProductPreorderStatus;
use App\Models\Product;
use App\Models\ProductLike;
use App\Models\ProductPreorderRequest;
use App\Models\User;
use App\Models\WishlistItem;
use Illuminate\Support\Facades\Schema;

/**
 * Merges viewer-specific fields onto a guest-safe cached product-detail payload.
 * Never writes user state back into Redis.
 */
final class ProductDetailUserOverlayService
{
    public function __construct(
        private readonly ProductSalesStatsService $salesStats,
    ) {}

    /**
     * @param  array{product: array<string, mixed>, analytics_product_id: string, analytics_vendor_account_id: string}  $payload
     * @return array{product: array<string, mixed>, analytics_product_id: string, analytics_vendor_account_id: string}
     */
    public function apply(array $payload, User $user): array
    {
        $product = $payload['product'];
        $productId = (string) $product['id'];
        $vendorId = (string) ($product['vendor']['id'] ?? $payload['analytics_vendor_account_id']);

        $related = is_array($product['related_products'] ?? null) ? $product['related_products'] : [];
        $relatedIds = collect($related)
            ->pluck('id')
            ->filter()
            ->map(fn ($id): string => (string) $id)
            ->values()
            ->all();

        $overlayIds = array_values(array_unique([$productId, ...$relatedIds]));

        $savedIds = $this->savedProductIds($user, $overlayIds);
        $liked = $this->userLikedProduct($user, $productId);
        $ownVendorId = VendorAccessResolver::vendorAccount($user)?->id;

        $product['user_liked'] = $liked;
        $product['user_saved'] = in_array($productId, $savedIds, true);
        $product['is_own_store'] = $ownVendorId !== null && $ownVendorId === $vendorId;
        $product['user_preorder_pending'] = $this->userPreorderPending($user, $product);

        if ($product['is_own_store']) {
            $product['sales_stats'] = $this->salesStatsForVendorProduct($productId);
        } else {
            unset($product['sales_stats']);
        }

        if ($related !== []) {
            $product['related_products'] = array_map(function (array $card) use ($savedIds, $ownVendorId): array {
                $cardVendorId = (string) ($card['vendor']['id'] ?? '');
                $card['user_saved'] = in_array((string) $card['id'], $savedIds, true);
                $card['is_own_store'] = $ownVendorId !== null
                    && $cardVendorId !== ''
                    && $ownVendorId === $cardVendorId;

                return $card;
            }, $related);
        }

        $payload['product'] = $product;

        return $payload;
    }

    /**
     * @param  list<string>  $productIds
     * @return list<string>
     */
    private function savedProductIds(User $user, array $productIds): array
    {
        if ($productIds === [] || ! $this->engagementTablesExist()) {
            return [];
        }

        return WishlistItem::query()
            ->where('user_id', $user->id)
            ->whereIn('product_id', $productIds)
            ->pluck('product_id')
            ->map(fn ($id): string => (string) $id)
            ->all();
    }

    private function userLikedProduct(User $user, string $productId): bool
    {
        if (! $this->engagementTablesExist()) {
            return false;
        }

        return ProductLike::query()
            ->where('user_id', $user->id)
            ->where('product_id', $productId)
            ->exists();
    }

    /**
     * @param  array<string, mixed>  $product
     */
    private function userPreorderPending(User $user, array $product): bool
    {
        if (($product['availability_mode'] ?? null) !== AvailabilityMode::Preorder->value) {
            return false;
        }

        if (! Schema::hasTable('product_preorder_requests')) {
            return false;
        }

        return ProductPreorderRequest::query()
            ->where('user_id', $user->id)
            ->where('product_id', $product['id'])
            ->where('status', ProductPreorderStatus::Pending)
            ->exists();
    }

    /**
     * @return array<string, mixed>|null
     */
    private function salesStatsForVendorProduct(string $productId): ?array
    {
        $product = Product::query()->whereKey($productId)->first();
        if ($product === null) {
            return null;
        }

        return $this->salesStats->forProduct($product);
    }

    private function engagementTablesExist(): bool
    {
        return once(function (): bool {
            return Schema::hasTable('product_likes')
                && Schema::hasTable('product_reviews')
                && Schema::hasTable('wishlist_items');
        });
    }
}
