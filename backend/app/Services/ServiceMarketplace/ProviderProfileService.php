<?php

namespace App\Services\ServiceMarketplace;

use App\Models\ProviderAccount;
use App\Models\Service;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class ProviderProfileService
{
    public function findActiveBySlug(string $slug): ProviderAccount
    {
        if ($slug === '' || $slug === 'null' || $slug === 'undefined') {
            throw new NotFoundHttpException(__('diyar.services.provider_not_found'));
        }

        $provider = ProviderAccount::query()
            ->active()
            ->where('slug', $slug)
            ->with('workPolicy')
            ->withCount([
                'services as active_services_count' => fn (Builder $q) => $q->where('is_active', true),
            ])
            ->first();

        if ($provider === null) {
            throw new NotFoundHttpException(__('diyar.services.provider_not_found'));
        }

        return $provider;
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listServices(ProviderAccount $provider, array $filters = [], ?User $user = null): LengthAwarePaginator
    {
        $query = Service::query()
            ->active()
            ->where('provider_account_id', $provider->id)
            ->with(['category', 'providerAccount']);

        $query->withUserSaved($user);

        $sort = (string) ($filters['sort'] ?? 'latest');
        match ($sort) {
            'most_requested' => $query->orderByDesc('requests_count')->orderByDesc('created_at'),
            'price_asc' => $query->orderBy('starting_price')->orderByDesc('created_at'),
            'price_desc' => $query->orderByDesc('starting_price')->orderByDesc('created_at'),
            default => $query->orderByDesc('created_at'),
        };

        $perPage = min((int) ($filters['per_page'] ?? 20), 100);

        return $query->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listOwnServices(User $user, array $filters = []): LengthAwarePaginator
    {
        $provider = ProviderAccountResolver::forUser($user);

        $query = Service::query()
            ->where('provider_account_id', $provider->id)
            ->with(['category', 'providerAccount'])
            ->orderByDesc('created_at');

        if (($filters['q'] ?? '') !== '') {
            $term = '%'.addcslashes((string) $filters['q'], '%_\\').'%';
            $query->where('title', 'like', $term);
        }

        $perPage = min(max((int) ($filters['per_page'] ?? 20), 1), 100);

        return $query->paginate($perPage);
    }
}
