<?php

namespace App\Domains\Catalog\Support\Filters\Context;

use App\Domains\Catalog\Support\Filters\FilterContentType;
use App\Domains\Catalog\Support\Filters\FilterSurface;

final readonly class FilterContextMeta
{
    public function __construct(
        public FilterContentType $contentType,
        public FilterSurface $surface,
        public int $resultCount,
        public string $resultDensity,
        public string $confidence,
        public ?string $categorySlug = null,
        public ?string $searchQuery = null,
        public ?string $locale = null,
        public ?string $sort = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return array_filter([
            'content_type' => $this->contentType->value,
            'surface' => $this->surface->value,
            'result_count' => $this->resultCount,
            'result_density' => $this->resultDensity,
            'confidence' => $this->confidence,
            'category' => $this->categorySlug,
            'search_query' => $this->searchQuery,
            'locale' => $this->locale,
            'sort' => $this->sort,
        ], static fn (mixed $value): bool => $value !== null && $value !== '');
    }
}
