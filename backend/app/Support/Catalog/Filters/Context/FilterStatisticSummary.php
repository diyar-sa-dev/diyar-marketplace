<?php

namespace App\Support\Catalog\Filters\Context;

final readonly class FilterStatisticSummary
{
    /**
     * @param  list<array{value: string, count: int, share: float}>  $topValues
     * @param  array<string, int>  $distribution
     */
    public function __construct(
        public int $distinctCount,
        public float $dominantShare,
        public float $distributionBalance,
        public int $availableValueCount,
        public array $topValues = [],
        public array $distribution = [],
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'distinct_count' => $this->distinctCount,
            'dominant_share' => round($this->dominantShare, 4),
            'distribution_balance' => round($this->distributionBalance, 4),
            'available_value_count' => $this->availableValueCount,
            'top_values' => $this->topValues,
            'distribution' => $this->distribution,
        ];
    }
}
