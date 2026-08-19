<?php

namespace App\Services\ServiceMarketplace;

use App\Models\Service;
use App\Models\ServiceWishlistItem;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class ServiceEngagementService
{
    public function __construct(
        private readonly ServiceCatalogService $catalog,
    ) {}

    public function findPublicService(string $identifier): Service
    {
        return $this->catalog->findPublic($identifier);
    }

    /**
     * @return array{saved: bool}
     */
    public function toggleWishlist(User $user, Service $service): array
    {
        try {
            return DB::transaction(function () use ($user, $service) {
                $existing = ServiceWishlistItem::query()
                    ->where('user_id', $user->id)
                    ->where('service_id', $service->id)
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    $existing->delete();

                    return ['saved' => false];
                }

                ServiceWishlistItem::query()->create([
                    'user_id' => $user->id,
                    'service_id' => $service->id,
                ]);

                return ['saved' => true];
            });
        } catch (QueryException $exception) {
            if ($this->isUniqueConstraintViolation($exception)) {
                return ['saved' => true];
            }

            throw $exception;
        }
    }

    public function userSaved(?User $user, Service $service): bool
    {
        if ($user === null || ! $this->tablesExist()) {
            return false;
        }

        if (array_key_exists('user_saved', $service->getAttributes())) {
            return (bool) $service->user_saved;
        }

        return ServiceWishlistItem::query()
            ->where('user_id', $user->id)
            ->where('service_id', $service->id)
            ->exists();
    }

    public function paginateWishlist(User $user, int $page = 1, int $perPage = 12): LengthAwarePaginator
    {
        if (! $this->tablesExist()) {
            return ServiceWishlistItem::query()->whereRaw('1 = 0')->paginate($perPage, ['*'], 'page', $page);
        }

        return ServiceWishlistItem::query()
            ->where('user_id', $user->id)
            ->whereHas('service', fn (Builder $query) => $query
                ->where('is_active', true)
                ->whereHas('providerAccount'))
            ->with(['service.providerAccount', 'service.category'])
            ->latest()
            ->paginate(perPage: min($perPage, 48), page: max($page, 1));
    }

    public function clearWishlist(User $user): int
    {
        if (! $this->tablesExist()) {
            return 0;
        }

        return ServiceWishlistItem::query()->where('user_id', $user->id)->delete();
    }

    public function countForUser(User $user): int
    {
        if (! $this->tablesExist()) {
            return 0;
        }

        return ServiceWishlistItem::query()
            ->where('user_id', $user->id)
            ->whereHas('service', fn (Builder $query) => $query->where('is_active', true))
            ->count();
    }

    private function tablesExist(): bool
    {
        return Schema::hasTable('service_wishlist_items');
    }

    private function isUniqueConstraintViolation(QueryException $exception): bool
    {
        $sqlState = $exception->errorInfo[0] ?? null;

        return in_array($sqlState, ['23000', '23505'], true);
    }
}
