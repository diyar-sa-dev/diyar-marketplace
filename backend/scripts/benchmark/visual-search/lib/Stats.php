<?php

declare(strict_types=1);

final class Stats
{
    /**
     * @param  list<float|int>  $values
     * @return array{p50: float, p95: float, p99: float, min: float, max: float, mean: float, count: int}
     */
    public static function percentiles(array $values): array
    {
        if ($values === []) {
            return ['p50' => 0, 'p95' => 0, 'p99' => 0, 'min' => 0, 'max' => 0, 'mean' => 0, 'count' => 0];
        }

        sort($values);
        $count = count($values);

        return [
            'p50' => self::atPercentile($values, 50),
            'p95' => self::atPercentile($values, 95),
            'p99' => self::atPercentile($values, 99),
            'min' => (float) $values[0],
            'max' => (float) $values[$count - 1],
            'mean' => array_sum($values) / $count,
            'count' => $count,
        ];
    }

    /**
     * @param  list<float|int>  $sorted
     */
    private static function atPercentile(array $sorted, int $percentile): float
    {
        $count = count($sorted);
        $index = (int) ceil(($percentile / 100) * $count) - 1;
        $index = max(0, min($count - 1, $index));

        return (float) $sorted[$index];
    }

    /**
     * @param  list<int>  $values
     */
    public static function distribution(array $values): array
    {
        if ($values === []) {
            return ['avg' => 0, 'median' => 0, 'p95' => 0, 'p99' => 0, 'max' => 0, 'min' => 0];
        }

        sort($values);

        return [
            'avg' => array_sum($values) / count($values),
            'median' => self::atPercentile($values, 50),
            'p95' => self::atPercentile($values, 95),
            'p99' => self::atPercentile($values, 99),
            'max' => (float) $values[count($values) - 1],
            'min' => (float) $values[0],
        ];
    }
}
