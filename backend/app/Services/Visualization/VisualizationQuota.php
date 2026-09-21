<?php

namespace App\Services\Visualization;

use Illuminate\Support\Facades\Cache;

final class VisualizationQuota
{
    public function tryConsume(int|string $userId): bool
    {
        $limit = (int) config('diyar.visualization.quota_per_user_per_day', 50);
        if ($limit <= 0) {
            return true;
        }

        $id = (string) $userId;
        $dayKey = now()->format('Y-m-d');
        $cacheKey = "viz:quota:{$id}:{$dayKey}";
        $lockKey = "viz:quota-lock:{$id}:{$dayKey}";

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
