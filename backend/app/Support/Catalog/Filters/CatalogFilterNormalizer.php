<?php

namespace App\Support\Catalog\Filters;

use App\Support\Pagination\PaginationBounds;

final class CatalogFilterNormalizer
{
    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function normalizeForProductListing(array $input): array
    {
        $normalized = $this->normalizeShared($input, maxPerPage: 50);
        $normalized = $this->normalizeProductSpecific($normalized);

        return $this->stripEmpty($normalized);
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function normalizeForServiceListing(array $input): array
    {
        $normalized = $this->normalizeShared($input, maxPerPage: 100);
        $normalized = $this->normalizeServiceSpecific($normalized);

        if (isset($normalized['category_slug']) && ! isset($normalized['category'])) {
            $normalized['category'] = $normalized['category_slug'];
        }

        unset($normalized['category_slug']);

        return $this->stripEmpty($normalized);
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function normalizeForCatalogSearch(array $input): array
    {
        $normalized = $this->normalizeShared($input, maxPerPage: 50);
        $normalized = $this->normalizeProductSpecific($normalized);
        $normalized = $this->normalizeServiceSpecific($normalized);

        if (! isset($normalized['type'])) {
            $normalized['type'] = 'all';
        }

        return $this->stripEmpty($normalized);
    }

    /**
     * @param  array<string, mixed>  $normalizedCatalogSearch
     * @return array<string, mixed>
     */
    public function productEngineFilters(array $normalizedCatalogSearch): array
    {
        $allowed = array_flip((new FilterCapabilityRegistry)->engineParametersFor(FilterContentType::Product));
        $allowed['page'] = true;
        $allowed['per_page'] = true;

        $filters = array_intersect_key($normalizedCatalogSearch, $allowed);
        unset($filters['type']);

        return $this->mapCatalogSearchProductSort($filters);
    }

    /**
     * @param  array<string, mixed>  $normalizedCatalogSearch
     * @return array<string, mixed>
     */
    public function serviceEngineFilters(array $normalizedCatalogSearch): array
    {
        $input = $normalizedCatalogSearch;

        if (isset($input['category_slug']) && ! isset($input['category'])) {
            $input['category'] = $input['category_slug'];
        }

        unset($input['category_slug'], $input['type']);

        $allowed = array_flip((new FilterCapabilityRegistry)->engineParametersFor(FilterContentType::Service));
        $allowed['page'] = true;
        $allowed['per_page'] = true;

        $filters = array_intersect_key($input, $allowed);

        return $this->mapCatalogSearchServiceSort($filters);
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function normalizeShared(array $input, int $maxPerPage = 50): array
    {
        $normalized = $input;

        if (isset($normalized['q'])) {
            $normalized['q'] = preg_replace('/\s+/u', ' ', trim((string) $normalized['q'])) ?: null;
        }

        foreach (['min_price', 'max_price', 'min_rating'] as $numericKey) {
            if (array_key_exists($numericKey, $normalized) && $normalized[$numericKey] !== null && $normalized[$numericKey] !== '') {
                $normalized[$numericKey] = (float) $normalized[$numericKey];
            }
        }

        foreach (['discounted', 'remote'] as $booleanKey) {
            if (array_key_exists($booleanKey, $normalized)) {
                $normalized[$booleanKey] = filter_var($normalized[$booleanKey], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            }
        }

        if (isset($normalized['page'])) {
            $normalized['page'] = PaginationBounds::page((int) $normalized['page']);
        }

        if (isset($normalized['per_page'])) {
            $normalized['per_page'] = PaginationBounds::perPage((int) $normalized['per_page'], $maxPerPage);
        }

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function normalizeProductSpecific(array $input): array
    {
        $normalized = $input;

        $colors = $this->normalizeColors(
            $normalized['colors'] ?? null,
            $normalized['color'] ?? null,
        );

        unset($normalized['color']);

        if ($colors !== []) {
            $normalized['colors'] = $colors;
        } else {
            unset($normalized['colors']);
        }

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function normalizeServiceSpecific(array $input): array
    {
        $normalized = $input;

        foreach (['category', 'location', 'provider', 'pricing_mode'] as $stringKey) {
            if (isset($normalized[$stringKey])) {
                $normalized[$stringKey] = trim((string) $normalized[$stringKey]) ?: null;
            }
        }

        return $normalized;
    }

    /**
     * @return list<string>
     */
    private function normalizeColors(mixed $colors, mixed $color): array
    {
        $values = [];

        if (is_array($colors)) {
            $values = array_merge($values, $colors);
        } elseif (is_string($colors) && trim($colors) !== '') {
            $values = array_merge($values, explode(',', $colors));
        }

        if (is_string($color) && trim($color) !== '') {
            $values[] = $color;
        }

        return array_values(array_unique(array_filter(array_map(
            static fn (mixed $value): string => trim((string) $value),
            $values,
        ))));
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function mapCatalogSearchProductSort(array $filters): array
    {
        $sort = $filters['sort'] ?? null;

        $filters['sort'] = match ($sort) {
            'latest', '-created_at', null, '' => '-created_at',
            '-popular' => '-popular',
            '-discount', 'discount' => '-discount',
            'price', '-price', 'name', '-name', 'created_at' => $sort,
            default => '-created_at',
        };

        return $filters;
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function mapCatalogSearchServiceSort(array $filters): array
    {
        $sort = $filters['sort'] ?? null;

        $filters['sort'] = match ($sort) {
            'rating', '-popular' => 'rating',
            'price' => 'price_asc',
            '-price' => 'price_desc',
            'latest', '-created_at', null, '' => 'latest',
            default => 'latest',
        };

        return $filters;
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function stripEmpty(array $filters): array
    {
        return array_filter(
            $filters,
            static fn (mixed $value): bool => $value !== null && $value !== '',
        );
    }
}
