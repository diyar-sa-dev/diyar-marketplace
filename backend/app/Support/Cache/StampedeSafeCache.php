<?php

namespace App\Support\Cache;

use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * Single-flight cache helper — one concurrent miss computes, others wait or fall back.
 *
 * On cache store failure, executes the callback directly so optional caching never
 * becomes a hard dependency for request handling.
 */
final class StampedeSafeCache
{
    /**
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    public static function remember(
        string $key,
        int $ttlSeconds,
        callable $callback,
        ?string $lockKey = null,
        int $lockSeconds = 30,
        int $blockSeconds = 5,
    ): mixed {
        try {
            $cached = Cache::get($key);
            if ($cached !== null) {
                return $cached;
            }
        } catch (Throwable) {
            return $callback();
        }

        $lock = null;

        try {
            $lock = Cache::lock($lockKey ?? 'lock:'.md5($key), $lockSeconds);
            $lock->block($blockSeconds);

            $cached = Cache::get($key);
            if ($cached !== null) {
                return $cached;
            }

            $value = $callback();
            Cache::put($key, $value, $ttlSeconds);

            return $value;
        } catch (LockTimeoutException) {
            return $callback();
        } catch (Throwable) {
            return $callback();
        } finally {
            optional($lock)->release();
        }
    }
}
