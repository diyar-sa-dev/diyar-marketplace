<?php

namespace App\Support\Catalog\Filters\Context;

final class ResultDensityClassifier
{
    public function classify(int $resultCount): string
    {
        if ($resultCount <= 0) {
            return 'zero';
        }

        $thresholds = config('diyar.catalog.filter_context.result_density', []);

        if ($resultCount <= (int) ($thresholds['very_low_max'] ?? 5)) {
            return 'very_low';
        }

        if ($resultCount <= (int) ($thresholds['low_max'] ?? 50)) {
            return 'low';
        }

        if ($resultCount <= (int) ($thresholds['medium_max'] ?? 500)) {
            return 'medium';
        }

        if ($resultCount <= (int) ($thresholds['high_max'] ?? 5000)) {
            return 'high';
        }

        return 'very_high';
    }

    public function confidence(int $resultCount): string
    {
        return match ($this->classify($resultCount)) {
            'zero' => 'none',
            'very_low', 'low' => 'low',
            'medium' => 'medium',
            default => 'high',
        };
    }
}
