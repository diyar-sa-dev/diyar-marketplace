<?php

namespace App\Support\Catalog\Filters\Context;

final class FilterDistributionMetrics
{
    /**
     * @param  list<array{value: string, count: int}>  $rows
     */
    public static function summarize(array $rows, int $totalCount): FilterStatisticSummary
    {
        if ($rows === [] || $totalCount <= 0) {
            return new FilterStatisticSummary(
                distinctCount: 0,
                dominantShare: 0.0,
                distributionBalance: 0.0,
                availableValueCount: 0,
            );
        }

        $topValues = [];
        $distribution = [];

        foreach ($rows as $row) {
            $count = (int) $row['count'];
            $value = (string) $row['value'];
            $share = round($count / max($totalCount, 1), 4);

            $topValues[] = [
                'value' => $value,
                'count' => $count,
                'share' => $share,
            ];

            $distribution[$value] = $count;
        }

        $dominantShare = $topValues[0]['share'];
        $distinctCount = count($topValues);

        return new FilterStatisticSummary(
            distinctCount: $distinctCount,
            dominantShare: $dominantShare,
            distributionBalance: round(max(0.0, 1.0 - $dominantShare), 4),
            availableValueCount: $distinctCount,
            topValues: $topValues,
            distribution: $distribution,
        );
    }

    /**
     * @param  array<string, int>  $distribution
     */
    public static function fromDistribution(array $distribution, int $totalCount): FilterStatisticSummary
    {
        $rows = [];

        foreach ($distribution as $value => $count) {
            $rows[] = ['value' => (string) $value, 'count' => (int) $count];
        }

        usort($rows, static fn (array $a, array $b): int => $b['count'] <=> $a['count']);

        return self::summarize($rows, $totalCount);
    }
}
