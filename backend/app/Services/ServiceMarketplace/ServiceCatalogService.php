<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\ProviderAccountStatus;
use App\Models\Service;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class ServiceCatalogService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function listPublic(array $filters = []): LengthAwarePaginator
    {
        $query = $this->publicQuery()
            ->with(['providerAccount', 'category']);

        $this->applyFilters($query, $filters);
        $this->applySort($query, (string) ($filters['sort'] ?? 'latest'));

        $perPage = min((int) ($filters['per_page'] ?? 20), 100);

        return $query->paginate($perPage);
    }

    public function findPublic(string $identifier): Service
    {
        $service = $this->publicQuery()
            ->with([
                'providerAccount',
                'category',
                'portfolioItems' => fn ($q) => $q->orderBy('sort_order'),
            ])
            ->where(function (Builder $query) use ($identifier) {
                $query->where('slug', $identifier);
                if (preg_match('/^[0-9a-f-]{36}$/i', $identifier) === 1) {
                    $query->orWhere('id', $identifier);
                }
            })
            ->first();

        if ($service === null) {
            throw new NotFoundHttpException(__('diyar.services.not_found'));
        }

        return $service;
    }

    /**
     * @return Collection<int, Service>
     */
    public function relatedServices(Service $service, int $limit = 8): Collection
    {
        return $this->publicQuery()
            ->with(['providerAccount', 'category'])
            ->where('service_category_id', $service->service_category_id)
            ->where('id', '!=', $service->id)
            ->orderByDesc('rating_average')
            ->limit($limit)
            ->get();
    }

    /**
     * @return Builder<Service>
     */
    private function publicQuery(): Builder
    {
        return Service::query()
            ->active()
            ->whereHas('providerAccount', fn (Builder $q) => $q
                ->where('status', ProviderAccountStatus::Active)
                ->whereNotNull('slug')
                ->where('slug', '!=', ''));
    }

    /**
     * @param  Builder<Service>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['category'])) {
            $categorySlug = (string) $filters['category'];
            $query->whereHas('category', fn (Builder $q) => $q
                ->where('slug', $categorySlug)
                ->where('is_active', true));
        }

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function (Builder $q) use ($term) {
                $q->where('title', 'like', $term)
                    ->orWhere('description', 'like', $term)
                    ->orWhereHas('providerAccount', fn (Builder $provider) => $provider
                        ->where('business_name', 'like', $term));
            });
        }

        if (! empty($filters['location'])) {
            $location = '%'.$filters['location'].'%';
            $query->where(function (Builder $q) use ($location) {
                $q->where('location', 'like', $location)
                    ->orWhereHas('providerAccount', fn (Builder $provider) => $provider
                        ->where('location', 'like', $location));
            });
        }

        if (! empty($filters['pricing_mode'])) {
            $query->where('pricing_mode', (string) $filters['pricing_mode']);
        }

        if (isset($filters['min_price']) && $filters['min_price'] !== '') {
            $query->where('starting_price', '>=', (float) $filters['min_price']);
        }

        if (isset($filters['max_price']) && $filters['max_price'] !== '') {
            $query->where('starting_price', '<=', (float) $filters['max_price']);
        }

        if (isset($filters['min_rating']) && $filters['min_rating'] !== '') {
            $query->where('rating_average', '>=', (float) $filters['min_rating']);
        }

        if (isset($filters['remote']) && $filters['remote'] !== '') {
            $remote = filter_var($filters['remote'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($remote !== null) {
                $query->where(function (Builder $q) use ($remote) {
                    $q->where('remote_available', $remote)
                        ->orWhereHas('providerAccount', fn (Builder $provider) => $provider
                            ->where('remote_available', $remote));
                });
            }
        }

        if (! empty($filters['provider'])) {
            $providerSlug = (string) $filters['provider'];
            $query->whereHas('providerAccount', fn (Builder $q) => $q->where('slug', $providerSlug));
        }
    }

    /**
     * @param  Builder<Service>  $query
     */
    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'most_requested' => $query->orderByDesc('requests_count')->orderByDesc('created_at'),
            'price_asc' => $query->orderBy('starting_price')->orderByDesc('created_at'),
            'price_desc' => $query->orderByDesc('starting_price')->orderByDesc('created_at'),
            'rating' => $query->orderByDesc('rating_average')->orderByDesc('reviews_count'),
            default => $query->orderByDesc('created_at'),
        };
    }
}
