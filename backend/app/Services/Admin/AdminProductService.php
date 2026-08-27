<?php

namespace App\Services\Admin;

use App\Enums\ProductStatus;
use App\Models\Product;
use App\Models\User;
use App\Services\Catalog\CatalogCacheInvalidator;
use Illuminate\Support\Facades\DB;

final class AdminProductService
{
    public function __construct(
        private readonly AdminAuditService $audit,
        private readonly CatalogCacheInvalidator $catalogCache,
    ) {}

    public function activate(Product $product, User $actor, ?string $reason = null): Product
    {
        if ($product->status === ProductStatus::Active) {
            return $product;
        }

        return DB::transaction(function () use ($product, $actor, $reason): Product {
            $before = ['status' => $product->status->value];
            $product->update(['status' => ProductStatus::Active]);
            $fresh = $product->fresh(['vendorAccount', 'category']);

            $this->audit->record(
                actor: $actor,
                action: 'product.activate',
                resource: $fresh,
                before: $before,
                after: ['status' => ProductStatus::Active->value],
                reason: $reason,
            );

            $this->catalogCache->invalidateSearchCachesAfterCommit();

            return $fresh;
        });
    }

    public function deactivate(Product $product, User $actor, ?string $reason = null): Product
    {
        if ($product->status === ProductStatus::Draft) {
            return $product;
        }

        return DB::transaction(function () use ($product, $actor, $reason): Product {
            $before = ['status' => $product->status->value];
            $product->update(['status' => ProductStatus::Draft]);
            $fresh = $product->fresh(['vendorAccount', 'category']);

            $this->audit->record(
                actor: $actor,
                action: 'product.deactivate',
                resource: $fresh,
                before: $before,
                after: ['status' => ProductStatus::Draft->value],
                reason: $reason,
            );

            $this->catalogCache->invalidateSearchCachesAfterCommit();

            return $fresh;
        });
    }

    public function archive(Product $product, User $actor, ?string $reason = null): Product
    {
        if ($product->status === ProductStatus::Archived && $product->trashed()) {
            return $product;
        }

        return DB::transaction(function () use ($product, $actor, $reason): Product {
            $before = [
                'status' => $product->status->value,
                'deleted_at' => $product->deleted_at?->toIso8601String(),
            ];

            $product->forceFill(['status' => ProductStatus::Archived])->save();

            if (! $product->trashed()) {
                $product->delete();
            }

            $fresh = $product->fresh(['vendorAccount', 'category']);

            $this->audit->record(
                actor: $actor,
                action: 'product.archive',
                resource: $fresh,
                before: $before,
                after: [
                    'status' => ProductStatus::Archived->value,
                    'deleted_at' => $fresh->deleted_at?->toIso8601String(),
                ],
                reason: $reason,
            );

            $this->catalogCache->invalidateSearchCachesAfterCommit();

            return $fresh;
        });
    }
}
