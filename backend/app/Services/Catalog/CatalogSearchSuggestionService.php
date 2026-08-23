<?php

namespace App\Services\Catalog;

use App\Models\Category;
use App\Models\Product;
use App\Models\Service;
use App\Models\VendorAccount;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;

final class CatalogSearchSuggestionService
{
    private const MIN_QUERY_LENGTH = 2;

    private const MAX_LIMIT = 12;

    /**
     * @return array{query: string, suggestions: list<array{id: string, type: string, label: string, slug: string, subtitle: string|null, href: string}>}
     */
    public function suggest(string $query, int $limit = 8): array
    {
        $normalized = preg_replace('/\s+/u', ' ', trim($query)) ?? '';
        $limit = max(1, min($limit, self::MAX_LIMIT));

        if (mb_strlen($normalized) < self::MIN_QUERY_LENGTH) {
            return [
                'query' => $normalized,
                'suggestions' => [],
            ];
        }

        $cacheKey = 'catalog.search.suggestions.'.md5(mb_strtolower($normalized)).'.'.$limit;

        return Cache::remember($cacheKey, now()->addSeconds(45), function () use ($normalized, $limit): array {
            $prefix = $normalized.'%';
            $contains = '%'.$normalized.'%';

            $suggestions = collect()
                ->merge($this->productSuggestions($prefix, $contains, min(4, $limit)))
                ->merge($this->vendorSuggestions($prefix, $contains, min(2, $limit)))
                ->merge($this->categorySuggestions($prefix, $contains, min(2, $limit)))
                ->merge($this->serviceSuggestions($prefix, $contains, min(2, $limit)))
                ->sortByDesc('score')
                ->values()
                ->take($limit)
                ->map(fn (array $item): array => [
                    'id' => $item['id'],
                    'type' => $item['type'],
                    'label' => $item['label'],
                    'slug' => $item['slug'],
                    'subtitle' => $item['subtitle'],
                    'href' => $item['href'],
                ])
                ->all();

            return [
                'query' => $normalized,
                'suggestions' => $suggestions,
            ];
        });
    }

    /**
     * @return list<array{id: string, type: string, label: string, slug: string, subtitle: string|null, href: string, score: int}>
     */
    private function productSuggestions(string $prefix, string $contains, int $limit): array
    {
        return Product::query()
            ->publiclyVisible()
            ->select(['id', 'name', 'slug', 'sale_price'])
            ->where(function (Builder $query) use ($prefix, $contains): void {
                $query->where('name', 'like', $prefix)
                    ->orWhere('name', 'like', $contains);
            })
            ->orderByRaw('CASE WHEN name LIKE ? THEN 0 ELSE 1 END', [$prefix])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (Product $product): array => [
                'id' => (string) $product->id,
                'type' => 'product',
                'label' => (string) $product->name,
                'slug' => (string) $product->slug,
                'subtitle' => number_format((float) $product->sale_price, 0).' SAR',
                'href' => '/product/'.(string) $product->slug,
                'score' => str_starts_with(mb_strtolower((string) $product->name), mb_strtolower(rtrim($prefix, '%'))) ? 100 : 80,
            ])
            ->all();
    }

    /**
     * @return list<array{id: string, type: string, label: string, slug: string, subtitle: string|null, href: string, score: int}>
     */
    private function vendorSuggestions(string $prefix, string $contains, int $limit): array
    {
        return VendorAccount::query()
            ->active()
            ->select(['id', 'business_name', 'slug'])
            ->where(function (Builder $query) use ($prefix, $contains): void {
                $query->where('business_name', 'like', $prefix)
                    ->orWhere('business_name', 'like', $contains);
            })
            ->orderByRaw('CASE WHEN business_name LIKE ? THEN 0 ELSE 1 END', [$prefix])
            ->limit($limit)
            ->get()
            ->map(fn (VendorAccount $vendor): array => [
                'id' => (string) $vendor->id,
                'type' => 'vendor',
                'label' => (string) $vendor->business_name,
                'slug' => (string) $vendor->slug,
                'subtitle' => null,
                'href' => '/store/'.(string) $vendor->slug,
                'score' => str_starts_with(mb_strtolower((string) $vendor->business_name), mb_strtolower(rtrim($prefix, '%'))) ? 90 : 70,
            ])
            ->all();
    }

    /**
     * @return list<array{id: string, type: string, label: string, slug: string, subtitle: string|null, href: string, score: int}>
     */
    private function categorySuggestions(string $prefix, string $contains, int $limit): array
    {
        return Category::query()
            ->active()
            ->select(['id', 'name', 'slug', 'type'])
            ->where(function (Builder $query) use ($prefix, $contains): void {
                $query->where('name', 'like', $prefix)
                    ->orWhere('name', 'like', $contains);
            })
            ->orderByRaw('CASE WHEN name LIKE ? THEN 0 ELSE 1 END', [$prefix])
            ->orderBy('sort_order')
            ->limit($limit)
            ->get()
            ->map(fn (Category $category): array => [
                'id' => (string) $category->id,
                'type' => 'category',
                'label' => (string) $category->name,
                'slug' => (string) $category->slug,
                'subtitle' => null,
                'href' => '/category/'.(string) $category->slug,
                'score' => str_starts_with(mb_strtolower((string) $category->name), mb_strtolower(rtrim($prefix, '%'))) ? 85 : 65,
            ])
            ->all();
    }

    /**
     * @return list<array{id: string, type: string, label: string, slug: string, subtitle: string|null, href: string, score: int}>
     */
    private function serviceSuggestions(string $prefix, string $contains, int $limit): array
    {
        return Service::query()
            ->active()
            ->whereHas('providerAccount', fn (Builder $query) => $query->where('status', 'active'))
            ->select(['id', 'title', 'slug', 'starting_price'])
            ->where(function (Builder $query) use ($prefix, $contains): void {
                $query->where('title', 'like', $prefix)
                    ->orWhere('title', 'like', $contains);
            })
            ->orderByRaw('CASE WHEN title LIKE ? THEN 0 ELSE 1 END', [$prefix])
            ->orderByDesc('requests_count')
            ->limit($limit)
            ->get()
            ->map(fn (Service $service): array => [
                'id' => (string) $service->id,
                'type' => 'service',
                'label' => (string) $service->title,
                'slug' => (string) $service->slug,
                'subtitle' => $service->starting_price !== null
                  ? 'من '.number_format((float) $service->starting_price, 0).' SAR'
                  : null,
                'href' => '/service/'.(string) $service->slug,
                'score' => str_starts_with(mb_strtolower((string) $service->title), mb_strtolower(rtrim($prefix, '%'))) ? 75 : 60,
            ])
            ->all();
    }
}
