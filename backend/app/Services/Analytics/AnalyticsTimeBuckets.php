<?php

namespace App\Services\Analytics;

use Carbon\CarbonImmutable;

final class AnalyticsTimeBuckets
{
    /**
     * @return list<array{label: string, from: CarbonImmutable, to: CarbonImmutable}>
     */
    public static function build(CarbonImmutable $from, CarbonImmutable $to, string $granularity): array
    {
        return match ($granularity) {
            'hour' => self::hourly($from, $to),
            'week' => self::weekly($from, $to),
            'month' => self::monthly($from, $to),
            default => self::daily($from, $to),
        };
    }

    /**
     * @return list<array{label: string, from: CarbonImmutable, to: CarbonImmutable}>
     */
    private static function hourly(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $buckets = [];
        $cursor = $from->startOfHour();

        while ($cursor <= $to) {
            $bucketEnd = $cursor->endOfHour();
            if ($bucketEnd > $to) {
                $bucketEnd = $to;
            }
            $buckets[] = ['label' => $cursor->format('H:i'), 'from' => $cursor, 'to' => $bucketEnd];
            $cursor = $cursor->addHour();
        }

        return $buckets;
    }

    /**
     * @return list<array{label: string, from: CarbonImmutable, to: CarbonImmutable}>
     */
    private static function daily(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $buckets = [];
        $cursor = $from->startOfDay();

        while ($cursor <= $to) {
            $bucketEnd = $cursor->endOfDay();
            if ($bucketEnd > $to) {
                $bucketEnd = $to;
            }
            $buckets[] = ['label' => $cursor->format('Y-m-d'), 'from' => $cursor, 'to' => $bucketEnd];
            $cursor = $cursor->addDay();
        }

        return $buckets;
    }

    /**
     * @return list<array{label: string, from: CarbonImmutable, to: CarbonImmutable}>
     */
    private static function weekly(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $buckets = [];
        $cursor = $from->startOfDay();

        while ($cursor <= $to) {
            $bucketEnd = $cursor->addDays(6)->endOfDay();
            if ($bucketEnd > $to) {
                $bucketEnd = $to;
            }
            $buckets[] = [
                'label' => $cursor->format('Y-m-d').' — '.$bucketEnd->format('Y-m-d'),
                'from' => $cursor,
                'to' => $bucketEnd,
            ];
            $cursor = $bucketEnd->addSecond()->startOfDay();
        }

        return $buckets;
    }

    /**
     * @return list<array{label: string, from: CarbonImmutable, to: CarbonImmutable}>
     */
    private static function monthly(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $buckets = [];
        $cursor = $from->startOfMonth();

        while ($cursor <= $to) {
            $bucketEnd = $cursor->endOfMonth();
            if ($bucketEnd > $to) {
                $bucketEnd = $to;
            }
            $buckets[] = ['label' => $cursor->format('Y-m'), 'from' => $cursor, 'to' => $bucketEnd];
            $cursor = $cursor->addMonth()->startOfMonth();
        }

        return $buckets;
    }
}
