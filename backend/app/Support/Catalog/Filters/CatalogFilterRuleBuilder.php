<?php

namespace App\Support\Catalog\Filters;

use Illuminate\Validation\Rule;

final class CatalogFilterRuleBuilder
{
    public function __construct(
        private readonly FilterCapabilityRegistry $registry,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function rules(FilterSurface $surface): array
    {
        $rules = [];

        foreach ($this->registry->forSurface($surface) as $capability) {
            foreach ($capability->queryParameters as $parameter) {
                if (isset($rules[$parameter])) {
                    continue;
                }

                $rules[$parameter] = $this->rulesForParameter($capability, $parameter, $surface);
            }
        }

        if ($surface === FilterSurface::CatalogSearch) {
            $rules['max_price'][] = 'gte:min_price';
        } elseif (isset($rules['min_price'], $rules['max_price'])) {
            $rules['max_price'][] = 'gte:min_price';
        }

        return $rules;
    }

    /**
     * @return list<mixed>
     */
    private function rulesForParameter(FilterCapability $capability, string $parameter, FilterSurface $surface): array
    {
        return match ($capability->key) {
            'q' => ['nullable', 'string', 'max:120'],
            'min_price', 'max_price', 'min_rating' => ['nullable', 'numeric', 'min:0'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => $this->perPageRules($surface),
            'sort' => ['nullable', Rule::in($this->sortValues($surface))],
            'type' => ['nullable', Rule::in(['all', 'products', 'services'])],
            'category_id', 'vendor_id' => ['nullable', 'uuid'],
            'category_slug', 'vendor_slug', 'material', 'location', 'provider' => ['nullable', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:120'],
            'color' => ['nullable', 'string', 'max:60'],
            'colors' => ['nullable', 'string', 'max:300'],
            'discounted', 'remote' => ['nullable', 'boolean'],
            'availability_mode' => ['nullable', Rule::in($capability->enumValues ?? [])],
            'product_type' => ['nullable', Rule::in($capability->enumValues ?? [])],
            'pricing_mode' => ['nullable', Rule::in($capability->enumValues ?? [])],
            default => ['nullable', 'string', 'max:120'],
        };
    }

    /**
     * @return list<mixed>
     */
    private function perPageRules(FilterSurface $surface): array
    {
        $max = $surface === FilterSurface::ServiceListing ? 100 : 50;

        return ['nullable', 'integer', 'min:1', 'max:'.$max];
    }

    /**
     * @return list<string>
     */
    private function sortValues(FilterSurface $surface): array
    {
        return match ($surface) {
            FilterSurface::ProductListing => FilterCapabilityRegistry::productSortValues(),
            FilterSurface::ServiceListing => FilterCapabilityRegistry::serviceSortValues(),
            FilterSurface::CatalogSearch => FilterCapabilityRegistry::catalogSearchSortValues(),
        };
    }
}
