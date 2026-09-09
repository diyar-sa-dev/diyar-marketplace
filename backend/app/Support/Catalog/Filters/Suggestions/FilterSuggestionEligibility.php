<?php

namespace App\Support\Catalog\Filters\Suggestions;

use App\Support\Catalog\Filters\Context\FilterContext;
use App\Support\Catalog\Filters\FilterCapability;

final class FilterSuggestionEligibility
{
    public function isEligible(FilterContext $context, FilterCapability $capability): bool
    {
        if (! $capability->enabled) {
            return false;
        }

        foreach ($this->lockedKeys($capability) as $key) {
            if (array_key_exists($key, $context->activeFilters)) {
                return false;
            }
        }

        if (in_array($capability->key, ['service_category', 'category_slug'], true) && $context->categorySlug !== null) {
            return false;
        }

        return true;
    }

    public function hasActivePriceFilter(FilterContext $context): bool
    {
        return array_key_exists('min_price', $context->activeFilters)
            || array_key_exists('max_price', $context->activeFilters);
    }

    /**
     * @return list<string>
     */
    public function lockedKeys(FilterCapability $capability): array
    {
        return match ($capability->key) {
            'min_price', 'max_price' => ['min_price', 'max_price'],
            'vendor_slug' => ['vendor_slug', 'vendor_id'],
            'colors' => ['colors', 'color'],
            default => [$capability->engineParameter],
        };
    }

    public function engineKeyToCapabilityKey(string $engineKey): string
    {
        return match ($engineKey) {
            'category' => 'service_category',
            'color' => 'colors',
            default => $engineKey,
        };
    }
}
