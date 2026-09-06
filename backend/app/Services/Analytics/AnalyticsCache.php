<?php

namespace App\Services\Analytics;

use App\Support\Cache\VersionedCache;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Throwable;

final class AnalyticsCache
{
    /**
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    public function remember(string $scope, string $scopeId, string $metric, CarbonInterface $from, CarbonInterface $to, array $filters, int $ttlSeconds, callable $callback): mixed
    {
        $version = $this->scopeVersion($scope, $scopeId);
        $filtersWithVersion = array_merge($filters, ['_v' => $version]);
        $key = $this->key($scope, $scopeId, $metric, $from, $to, $filtersWithVersion);

        try {
            $cached = Cache::get($key);
            if ($cached !== null) {
                return $cached;
            }
        } catch (Throwable) {
            return $callback();
        }

        $lock = Cache::lock('analytics:lock:'.md5($key), 30);

        try {
            $lock->block(5);

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

    public function invalidateScope(string $scope, string $scopeId): void
    {
        VersionedCache::bump($this->versionKey($scope, $scopeId));
    }

    /**
     * @param  array<string, scalar|null>  $filters
     */
    public function key(
        string $scope,
        string $scopeId,
        string $metric,
        CarbonInterface $from,
        CarbonInterface $to,
        array $filters = [],
    ): string {
        ksort($filters);
        $filterHash = md5(json_encode($filters, JSON_THROW_ON_ERROR));

        return sprintf(
            'analytics:%s:%s:%s:%s:%s:%s',
            $scope,
            $scopeId,
            $metric,
            $from->toDateString(),
            $to->toDateString(),
            $filterHash,
        );
    }

    private function scopeVersion(string $scope, string $scopeId): int
    {
        return (int) Cache::get($this->versionKey($scope, $scopeId), 0);
    }

    private function versionKey(string $scope, string $scopeId): string
    {
        return sprintf('analytics:version:%s:%s', $scope, $scopeId);
    }
}
