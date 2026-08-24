<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\ProviderAccountStatus;
use App\Models\Service;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class ServiceCatalogService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function listPublic(array $filters = [], ?User $user = null): LengthAwarePaginator
    {
        $query = $this->publicQuery()
            ->with([
                'providerAccount:id,business_name,slug,avatar_path,verified',
                'category:id,name,slug,type',
            ]);

        $query->withUserSaved($user);

        $this->applyFilters($query, $filters);
        $this->applySort($query, (string) ($filters['sort'] ?? 'latest'));

        $perPage = min((int) ($filters['per_page'] ?? 20), 100);

        return $query->paginate($perPage);
    }

    public function findPublic(string $identifier, ?User $user = null): Service
    {
        $query = $this->publicQuery()
            ->with([
                'providerAccount.user',
                'category',
                'portfolioItems' => fn ($q) => $q->orderBy('sort_order'),
            ])
            ->where(function (Builder $query) use ($identifier) {
                $query->where('services.slug', $identifier);
                if (preg_match('/^[0-9a-f-]{36}$/i', $identifier) === 1) {
                    $query->orWhere('services.id', $identifier);
                }
            });

        $query->withUserSaved($user);

        $service = $query->first();

        if ($service === null) {
            throw new NotFoundHttpException(__('diyar.services.not_found'));
        }

        return $service;
    }

    /**
     * @return Collection<int, Service>
     */
    public function relatedServices(Service $service, int $limit = 8, ?User $user = null): Collection
    {
        $query = $this->publicQuery()
            ->with([
                'providerAccount:id,business_name,slug,avatar_path,verified',
                'category:id,name,slug,type',
            ])
            ->where('service_category_id', $service->service_category_id)
            ->where('id', '!=', $service->id)
            ->orderByDesc('rating_average')
            ->limit($limit);

        $query->withUserSaved($user);

        return $query->get();
    }

    /**
     * @return Builder<Service>
     */
    private function publicQuery(): Builder
    {
        return Service::query()
            ->active()
            ->join('provider_accounts', 'provider_accounts.id', '=', 'services.provider_account_id')
            ->where('provider_accounts.status', ProviderAccountStatus::Active)
            ->whereNotNull('provider_accounts.slug')
            ->where('provider_accounts.slug', '!=', '')
            ->select('services.*');
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
                $q->where('services.title', 'like', $term)
                    ->orWhere('services.description', 'like', $term)
                    ->orWhere('provider_accounts.business_name', 'like', $term);
            });
        }

        if (! empty($filters['location'])) {
            $location = '%'.$filters['location'].'%';
            $query->where(function (Builder $q) use ($location) {
                $q->where('services.location', 'like', $location)
                    ->orWhere('provider_accounts.location', 'like', $location);
            });
        }

        if (! empty($filters['pricing_mode'])) {
            $query->where('services.pricing_mode', (string) $filters['pricing_mode']);
        }

        if (isset($filters['min_price']) && $filters['min_price'] !== '') {
            $query->where('services.starting_price', '>=', (float) $filters['min_price']);
        }

        if (isset($filters['max_price']) && $filters['max_price'] !== '') {
            $query->where('services.starting_price', '<=', (float) $filters['max_price']);
        }

        if (isset($filters['min_rating']) && $filters['min_rating'] !== '') {
            $query->where('services.rating_average', '>=', (float) $filters['min_rating']);
        }

        if (isset($filters['remote']) && $filters['remote'] !== '') {
            $remote = filter_var($filters['remote'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($remote !== null) {
                $query->where(function (Builder $q) use ($remote) {
                    $q->where('services.remote_available', $remote)
                        ->orWhere('provider_accounts.remote_available', $remote);
                });
            }
        }

        if (! empty($filters['provider'])) {
            $providerSlug = (string) $filters['provider'];
            $query->where('provider_accounts.slug', $providerSlug);
        }
    }

    /**
     * @param  Builder<Service>  $query
     */
    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'most_requested' => $query->orderByDesc('services.requests_count')->orderByDesc('services.created_at'),
            'price_asc' => $query->orderBy('services.starting_price')->orderByDesc('services.created_at'),
            'price_desc' => $query->orderByDesc('services.starting_price')->orderByDesc('services.created_at'),
            'rating' => $query->orderByDesc('services.rating_average')->orderByDesc('services.reviews_count'),
            default => $query->orderByDesc('services.created_at'),
        };
    }
}
