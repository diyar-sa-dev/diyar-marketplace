<?php

namespace App\Support\Security;

use Illuminate\Support\Facades\Cache;

final class RevokedSessionCache
{
    public static function markRevoked(string $laravelSessionId): void
    {
        try {
            $hash = SessionLookupHash::make($laravelSessionId);
            Cache::put(self::key($hash), true, self::ttlSeconds());
        } catch (\Throwable $exception) {
            report($exception);
        }
    }

    public static function isRevoked(string $laravelSessionId): bool
    {
        try {
            $hash = SessionLookupHash::make($laravelSessionId);
            $cacheKey = self::key($hash);

            $cached = Cache::get($cacheKey);
            if ($cached === true) {
                return true;
            }

            if ($cached === false) {
                return false;
            }

            return false;
        } catch (\Throwable $exception) {
            report($exception);

            return false;
        }
    }

    public static function rememberActive(string $laravelSessionId): void
    {
        try {
            $hash = SessionLookupHash::make($laravelSessionId);
            Cache::add(self::key($hash), false, 60);
        } catch (\Throwable) {
            // Non-critical negative cache.
        }
    }

    private static function key(string $hash): string
    {
        return 'revoked_session:'.$hash;
    }

    private static function ttlSeconds(): int
    {
        return max(300, (int) config('session.lifetime', 120) * 60);
    }
}
