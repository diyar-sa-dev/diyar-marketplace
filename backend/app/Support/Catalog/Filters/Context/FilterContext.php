<?php

namespace App\Support\Catalog\Filters\Context;

use App\Support\Catalog\Filters\FilterContentType;
use App\Support\Catalog\Filters\FilterSurface;

final readonly class FilterContext
{
    /**
     * @param  array<string, mixed>  $activeFilters  Normalized engine filters excluding q/category/sort/pagination/type.
     */
    public function __construct(
        public FilterContentType $contentType,
        public FilterSurface $surface,
        public ?string $categorySlug,
        public ?string $searchQuery,
        public array $activeFilters,
        public ?string $locale,
        public ?string $sort,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'content_type' => $this->contentType->value,
            'surface' => $this->surface->value,
            'category' => $this->categorySlug,
            'search_query' => $this->searchQuery,
            'active_filters' => $this->activeFilters,
            'locale' => $this->locale,
            'sort' => $this->sort,
        ];
    }
}
