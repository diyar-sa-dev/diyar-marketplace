<?php

namespace App\Support\Cache;

use Illuminate\Support\Facades\Cache;

final class B2bCache
{
    private const TTL_MINUTES = 15;

    /**
     * @param  array<string, mixed>  $filters
     */
    public function companiesListKey(array $filters): string
    {
        return 'diyar:b2b:v'.$this->version().':companies:list:'.md5(json_encode($filters));
    }

    public function companyDetailKey(string $slug): string
    {
        return 'diyar:b2b:v'.$this->version().':companies:show:'.$slug;
    }

    public function categoriesKey(): string
    {
        return 'diyar:b2b:v'.$this->version().':categories';
    }

    public function directoryStatsKey(): string
    {
        return 'diyar:b2b:v'.$this->version().':directory-stats';
    }

    public function ttl(): \DateTimeInterface
    {
        return now()->addMinutes(self::TTL_MINUTES);
    }

    public function forget(): void
    {
        Cache::increment('diyar:b2b:cache-v');
    }

    private function version(): int
    {
        return (int) Cache::get('diyar:b2b:cache-v', 0);
    }
}
