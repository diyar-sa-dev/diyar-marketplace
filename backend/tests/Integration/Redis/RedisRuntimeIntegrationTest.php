<?php

namespace Tests\Integration\Redis;

use App\Support\Cache\CacheKeys;
use App\Support\Cache\StampedeSafeCache;
use App\Support\Cache\VersionedCache;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Redis;
use PHPUnit\Framework\Attributes\Group;
use Tests\TestCase;

/**
 * Requires reachable Redis (Docker: REDIS_HOST=127.0.0.1:6379).
 */
#[Group('redis-integration')]
class RedisRuntimeIntegrationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (config('cache.default') !== 'redis') {
            $this->markTestSkipped('CACHE_STORE is not redis');
        }

        try {
            Redis::connection()->ping();
        } catch (\Throwable $e) {
            $this->markTestSkipped('Redis unreachable: '.$e->getMessage());
        }
    }

    public function test_redis_cache_store_roundtrip(): void
    {
        $key = 'test:redis:'.bin2hex(random_bytes(4));
        Cache::store('redis')->put($key, 'value', 30);
        $this->assertSame('value', Cache::store('redis')->get($key));
        Cache::store('redis')->forget($key);
    }

    public function test_versioned_cache_uses_redis_increment(): void
    {
        $key = 'test:version:'.bin2hex(random_bytes(4));
        Cache::forever($key, 0);
        $this->assertSame(1, VersionedCache::bump($key));
        $this->assertSame(1, VersionedCache::version($key));
        $this->assertSame(2, VersionedCache::bump($key));
        $this->assertSame(2, VersionedCache::version($key));
    }

    public function test_stampede_safe_cache_on_redis(): void
    {
        $key = 'test:stampede:'.bin2hex(random_bytes(4));
        $calls = 0;
        StampedeSafeCache::remember($key, 60, function () use (&$calls) {
            $calls++;

            return 'ok';
        });
        StampedeSafeCache::remember($key, 60, function () use (&$calls) {
            $calls++;

            return 'ok';
        });
        $this->assertSame(1, $calls);
        Cache::forget($key);
    }

    public function test_admin_permission_keys_are_uuid_scoped(): void
    {
        $a = CacheKeys::adminPermissions('11111111-1111-1111-1111-111111111111', 0);
        $b = CacheKeys::adminPermissions('22222222-2222-2222-2222-222222222222', 0);
        $this->assertNotSame($a, $b);
        $this->assertStringContainsString('11111111', $a);
    }

    public function test_rate_limiter_on_redis_backend(): void
    {
        $key = 'test:rl:'.bin2hex(random_bytes(4));
        RateLimiter::clear($key);
        RateLimiter::hit($key, 60);
        RateLimiter::hit($key, 60);
        RateLimiter::hit($key, 60);
        $this->assertTrue(RateLimiter::tooManyAttempts($key, 3));
        RateLimiter::clear($key);
    }

    public function test_redis_queue_connection_is_available(): void
    {
        $this->assertSame('redis', config('queue.default'));
        Queue::connection('redis')->size();
        $this->assertTrue(true);
    }
}
