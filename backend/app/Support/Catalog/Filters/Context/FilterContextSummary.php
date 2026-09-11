<?php

namespace App\Support\Catalog\Filters\Context;

final readonly class FilterContextSummary
{
    /**
     * @param  array<string, FilterStatisticSummary>  $filterStatistics
     */
    public function __construct(
        public FilterContextMeta $context,
        public ?FilterPriceSummary $price,
        public array $filterStatistics,
        public ?FilterRatingSummary $rating = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $statistics = [];

        foreach ($this->filterStatistics as $key => $statistic) {
            $statistics[$key] = $statistic->toArray();
        }

        return array_filter([
            'context' => $this->context->toArray(),
            'price' => $this->price?->toArray(),
            'rating' => $this->rating?->toArray(),
            'filter_statistics' => $statistics,
        ], static fn (mixed $value): bool => $value !== null);
    }
}
