<?php

namespace App\Support\Cache;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

final class VersionedCache
{
    public static function version(string $versionKey): int
    {
        try {
            return (int) Cache::get($versionKey, 0);
        } catch (Throwable) {
            return 0;
        }
    }

    public static function bump(string $versionKey): int
    {
        try {
            if (! Cache::has($versionKey)) {
                Cache::forever($versionKey, 0);
            }

            return (int) Cache::increment($versionKey);
        } catch (Throwable) {
            return self::version($versionKey);
        }
    }

    public static function bumpAfterCommit(string $versionKey): void
    {
        if (DB::transactionLevel() > 0) {
            DB::afterCommit(fn () => self::bump($versionKey));

            return;
        }

        self::bump($versionKey);
    }
}
