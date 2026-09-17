<?php

namespace App\Support\Catalog\Filters\Context;

final readonly class FilterPriceSummary
{
    public function __construct(
        public float $min,
        public float $max,
        public float $avg,
    ) {}

    /**
     * @return array<string, float>
     */
    public function toArray(): array
    {
        return [
            'min' => $this->min,
            'max' => $this->max,
            'avg' => $this->avg,
        ];
    }
}
