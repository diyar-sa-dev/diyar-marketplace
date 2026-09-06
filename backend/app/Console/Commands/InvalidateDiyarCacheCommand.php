<?php

namespace App\Console\Commands;

use App\Support\Cache\CacheKeys;
use App\Support\Cache\VersionedCache;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

/**
 * Domain-scoped cache invalidation — never performs Cache::flush().
 */
final class InvalidateDiyarCacheCommand extends Command
{
    protected $signature = 'diyar:cache:invalidate
                            {domain : catalog|admin-permissions|analytics-platform|shipping|blog|b2b|all}';

    protected $description = 'Bump version keys for a DIYAR cache domain (safe, non-destructive)';

    public function handle(): int
    {
        $domain = strtolower((string) $this->argument('domain'));

        if (! in_array($domain, ['catalog', 'admin-permissions', 'analytics-platform', 'shipping', 'blog', 'b2b', 'all'], true)) {
            $this->invalidDomain($domain);

            return self::FAILURE;
        }

        match ($domain) {
            'catalog' => $this->bump(CacheKeys::CATALOG_VERSION, 'catalog search caches'),
            'admin-permissions' => $this->bump(CacheKeys::ADMIN_PERMISSIONS_VERSION, 'admin permission caches'),
            'analytics-platform' => $this->bump('analytics:version:admin:platform', 'platform analytics caches'),
            'shipping' => $this->bumpShipping(),
            'blog' => $this->increment('diyar:blog:cache-v', 'blog CMS caches'),
            'b2b' => $this->increment('diyar:b2b:cache-v', 'B2B CMS caches'),
            'all' => $this->invalidateAll(),
        };

        return self::SUCCESS;
    }

    private function bump(string $versionKey, string $label): void
    {
        $next = VersionedCache::bump($versionKey);
        $this->info("Invalidated {$label} (version {$next}).");
    }

    private function bumpShipping(): void
    {
        if (! Cache::has('shipping:config:version')) {
            Cache::forever('shipping:config:version', 2);
        } else {
            Cache::increment('shipping:config:version');
        }

        $this->info('Invalidated shipping configuration caches.');
    }

    private function increment(string $versionKey, string $label): void
    {
        Cache::increment($versionKey);
        $this->info("Invalidated {$label}.");
    }

    private function invalidateAll(): void
    {
        $this->bump(CacheKeys::CATALOG_VERSION, 'catalog search caches');
        $this->bump(CacheKeys::ADMIN_PERMISSIONS_VERSION, 'admin permission caches');
        $this->bump('analytics:version:admin:platform', 'platform analytics caches');
        $this->bumpShipping();
        $this->increment('diyar:blog:cache-v', 'blog CMS caches');
        $this->increment('diyar:b2b:cache-v', 'B2B CMS caches');
        $this->info('All domain version keys bumped. No global flush performed.');
    }

    private function invalidDomain(string $domain): void
    {
        $this->error("Unknown domain [{$domain}]. Valid: catalog, admin-permissions, analytics-platform, shipping, blog, b2b, all");
    }
}
