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
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class CacheDeepAuditTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(AdminPermissionSeeder::class);
    }

    public function test_catalog_version_bump_is_deferred_until_transaction_commits(): void
    {
        $before = VersionedCache::version(CacheKeys::CATALOG_VERSION);

        try {
            DB::transaction(function (): void {
                app(CatalogCacheInvalidator::class)->invalidateSearchCachesAfterCommit();
                throw new RuntimeException('rollback');
            });
        } catch (RuntimeException) {
        }

        $this->assertSame($before, VersionedCache::version(CacheKeys::CATALOG_VERSION));
    }

    public function test_catalog_version_bumps_after_successful_transaction(): void
    {
        $before = VersionedCache::version(CacheKeys::CATALOG_VERSION);

        DB::transaction(function (): void {
            app(CatalogCacheInvalidator::class)->invalidateSearchCachesAfterCommit();
        });

        $this->assertSame($before + 1, VersionedCache::version(CacheKeys::CATALOG_VERSION));
    }

    public function test_admin_permission_cache_keys_are_isolated_per_user(): void
    {
        $adminA = $this->createUserWithRole(RoleName::Admin);
        $adminB = $this->createUserWithRole(RoleName::Admin);
        $service = app(AdminPermissionService::class);

        $service->permissionKeysFor($adminA);
        $service->permissionKeysFor($adminB);

        $version = VersionedCache::version(CacheKeys::ADMIN_PERMISSIONS_VERSION);
        $keyA = CacheKeys::adminPermissions((string) $adminA->id, $version);
        $keyB = CacheKeys::adminPermissions((string) $adminB->id, $version);

        $this->assertNotSame($adminA->id, $adminB->id);

        $this->assertNotSame($keyA, $keyB);
        $this->assertTrue(Cache::has($keyA));
        $this->assertTrue(Cache::has($keyB));

        $service->forget($adminA);

        $this->assertFalse(Cache::has($keyA));
        $this->assertTrue(Cache::has($keyB));
    }

    public function test_versioned_cache_bump_is_monotonic_under_repeated_increments(): void
    {
        $key = 'test:version:'.bin2hex(random_bytes(4));
        Cache::forever($key, 0);

        $first = VersionedCache::bump($key);
        $second = VersionedCache::bump($key);

        $this->assertSame(1, $first);
        $this->assertSame(2, $second);
        $this->assertSame(2, VersionedCache::version($key));
    }

    public function test_stampede_safe_cache_computes_once_on_warm_path(): void
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

    public function test_diyar_cache_invalidate_command_bumps_catalog_without_flush(): void
    {
        Cache::put('unrelated:deep-audit', 'preserve', 3600);
        $before = VersionedCache::version(CacheKeys::CATALOG_VERSION);

        $this->artisan('diyar:cache:invalidate', ['domain' => 'catalog'])
            ->assertSuccessful();

        $this->assertSame($before + 1, VersionedCache::version(CacheKeys::CATALOG_VERSION));
        $this->assertSame('preserve', Cache::get('unrelated:deep-audit'));
    }
}
