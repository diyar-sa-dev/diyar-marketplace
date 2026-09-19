<?php

namespace App\Services\Visualization;

use Illuminate\Support\Facades\Cache;

final class VisualizationQuota
{
    public function tryConsume(int $userId): bool
    {
        $limit = (int) config('diyar.visualization.quota_per_user_per_day', 50);
        if ($limit <= 0) {
            return true;
        }

        $dayKey = now()->format('Y-m-d');
        $cacheKey = "viz:quota:{$userId}:{$dayKey}";
        $lockKey = "viz:quota-lock:{$userId}:{$dayKey}";

        return (bool) Cache::lock($lockKey, 5)->block(3, function () use ($cacheKey, $limit) {
            $count = (int) Cache::get($cacheKey, 0);
            if ($count >= $limit) {
                return false;
            }

            Cache::put($cacheKey, $count + 1, now()->endOfDay());

            return true;
        });
    }
}
