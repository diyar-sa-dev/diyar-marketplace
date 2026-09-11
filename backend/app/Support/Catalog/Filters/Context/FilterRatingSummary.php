<?php

namespace App\Support\Catalog\Filters\Context;

final readonly class FilterRatingSummary
{
    public function __construct(
        public float $avg,
        public float $min,
        public float $max,
    ) {}

    /**
     * @return array<string, float>
     */
    public function toArray(): array
    {
        return [
            'avg' => round($this->avg, 2),
            'min' => round($this->min, 2),
            'max' => round($this->max, 2),
        ];
    }
}
