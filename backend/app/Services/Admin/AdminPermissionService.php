<?php

namespace App\Services\Admin;

use App\Enums\AdminPermission;
use App\Enums\RoleName;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Support\Cache\CacheKeys;
use App\Support\Cache\VersionedCache;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

final class AdminPermissionService
{
    private const CACHE_TTL_SECONDS = 3600;

    public function canAccessPanel(User $user): bool
    {
        return $user->isActive() && $user->hasRole(RoleName::Admin);
    }

    public function has(User $user, AdminPermission|string $permission): bool
    {
        if (! $this->canAccessPanel($user)) {
            return false;
        }

        $key = $permission instanceof AdminPermission ? $permission->value : $permission;

        return $this->permissionKeysFor($user)->contains($key);
    }

    /** @return Collection<int, string> */
    public function permissionKeysFor(User $user): Collection
    {
        $cacheKey = $this->cacheKey($user);
        $cached = Cache::get($cacheKey);

        if (is_array($cached)) {
            return collect($cached);
        }

        if ($cached !== null) {
            // Drop legacy/corrupt cache entries (e.g. serialized Collection objects).
            Cache::forget($cacheKey);
        }

        $keys = $this->resolvePermissionKeys($user)->values()->all();

        Cache::put($cacheKey, $keys, self::CACHE_TTL_SECONDS);

        return collect($keys);
    }

    public function forget(User $user): void
    {
        Cache::forget($this->cacheKey($user));
    }

    public function forgetAfterCommit(User $user): void
    {
        if (DB::transactionLevel() > 0) {
            DB::afterCommit(fn () => $this->forget($user));

            return;
        }

        $this->forget($user);
    }

    public function forgetAll(): void
    {
        VersionedCache::bump(CacheKeys::ADMIN_PERMISSIONS_VERSION);
    }

    public function forgetAllAfterCommit(): void
    {
        VersionedCache::bumpAfterCommit(CacheKeys::ADMIN_PERMISSIONS_VERSION);
    }

    /** @return Collection<int, string> */
    private function resolvePermissionKeys(User $user): Collection
    {
        $user->loadMissing('roles');

        $adminRole = $user->roles->first(
            fn (Role $role) => $role->name === RoleName::Admin,
        );

        if ($adminRole === null) {
            return collect();
        }

        return Permission::query()
            ->whereHas('roles', fn ($query) => $query->where('roles.id', $adminRole->id))
            ->pluck('key');
    }

    private function cacheKey(User $user): string
    {
        return CacheKeys::adminPermissions(
            (string) $user->id,
            VersionedCache::version(CacheKeys::ADMIN_PERMISSIONS_VERSION),
        );
    }
}
