<?php

namespace App\Services\Shipping;

use Illuminate\Support\Facades\Cache;

final class ShippingConfigCache
{
    private const VERSION_KEY = 'shipping:config:version';

    public function version(): int
    {
        return max(1, (int) Cache::get(self::VERSION_KEY, 1));
    }

    public function bump(): void
    {
        if (! Cache::has(self::VERSION_KEY)) {
            Cache::forever(self::VERSION_KEY, 2);

            return;
        }

        Cache::increment(self::VERSION_KEY);
    }
}
