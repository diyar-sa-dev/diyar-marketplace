<?php

namespace Tests\Feature\Cache;

use App\Enums\RoleName;
use App\Services\Admin\AdminPermissionService;
use App\Services\Catalog\CatalogCacheInvalidator;
use App\Support\Cache\CacheKeys;
use App\Support\Cache\StampedeSafeCache;
use App\Support\Cache\VersionedCache;
use Database\Seeders\AdminPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class CacheOptimizationTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(AdminPermissionSeeder::class);
    }

    public function test_admin_permission_forget_all_bumps_version_without_flushing_unrelated_cache(): void
    {
        Cache::put('unrelated:key', 'keep-me', 3600);

        $admin = $this->createUserWithRole(RoleName::Admin);
        $service = app(AdminPermissionService::class);

        $beforeKey = CacheKeys::adminPermissions((string) $admin->id, VersionedCache::version(CacheKeys::ADMIN_PERMISSIONS_VERSION));
        $service->permissionKeysFor($admin);
        $this->assertTrue(Cache::has($beforeKey));

        $service->forgetAll();

        $afterKey = CacheKeys::adminPermissions((string) $admin->id, VersionedCache::version(CacheKeys::ADMIN_PERMISSIONS_VERSION));
        $this->assertNotSame($beforeKey, $afterKey);
        $this->assertSame('keep-me', Cache::get('unrelated:key'));
    }

    public function test_catalog_cache_invalidation_bumps_version(): void
    {
        $before = VersionedCache::version(CacheKeys::CATALOG_VERSION);

        app(CatalogCacheInvalidator::class)->invalidateSearchCaches();

        $this->assertSame($before + 1, VersionedCache::version(CacheKeys::CATALOG_VERSION));
    }

    public function test_stampede_safe_cache_returns_cached_value_on_second_call(): void
    {
        $calls = 0;
        $key = 'test:stampede:'.bin2hex(random_bytes(4));

        $first = StampedeSafeCache::remember($key, 60, function () use (&$calls) {
            $calls++;

            return ['count' => $calls];
        });

        $second = StampedeSafeCache::remember($key, 60, function () use (&$calls) {
            $calls++;

            return ['count' => $calls];
        });

        $this->assertSame(['count' => 1], $first);
        $this->assertSame(['count' => 1], $second);
        $this->assertSame(1, $calls);

        Cache::forget($key);
    }
}
