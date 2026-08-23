<?php

namespace App\Services\Catalog;

use App\Enums\ProductStatus;
use App\Models\VendorAccount;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class VendorService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function listPublic(array $filters = []): LengthAwarePaginator
    {
        $query = VendorAccount::query()
            ->active()
            ->whereNotNull('slug')
            ->where('slug', '!=', '')
            ->withCount([
                'products as active_products_count' => fn ($q) => $q
                    ->where('status', ProductStatus::Active)
                    ->whereNull('deleted_at'),
                'storeReviews as store_reviews_count',
            ])
            ->withAvg('storeReviews', 'rating');

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function ($q) use ($term) {
                $q->where('business_name', 'like', $term)
                    ->orWhere('description', 'like', $term)
                    ->orWhere('location', 'like', $term);
            });
        }

        $perPage = min((int) ($filters['per_page'] ?? 20), 100);

        return $query->orderBy('business_name')->paginate($perPage);
    }

    public function findActiveBySlug(string $slug): VendorAccount
    {
        if ($slug === '' || $slug === 'null' || $slug === 'undefined') {
            throw new NotFoundHttpException(__('diyar.catalog.vendor_not_found'));
        }

        $vendor = VendorAccount::query()
            ->active()
            ->where('slug', $slug)
            ->with([
                'workingHours',
                'returnPolicy',
                'shippingSettings',
            ])
            ->withCount([
                'products as active_products_count' => fn ($q) => $q
                    ->where('status', ProductStatus::Active)
                    ->whereNull('deleted_at'),
                'storeReviews as store_reviews_count',
            ])
            ->withAvg('storeReviews', 'rating')
            ->first();

        if ($vendor === null) {
            throw new NotFoundHttpException(__('diyar.catalog.vendor_not_found'));
        }

        return $vendor;
    }
}
