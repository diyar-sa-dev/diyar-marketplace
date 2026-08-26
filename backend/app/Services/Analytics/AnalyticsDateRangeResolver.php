<?php

namespace App\Services\Analytics;

use App\Enums\FinancePeriod;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;

final class AnalyticsDateRangeResolver
{
    /**
     * @return array{
     *     preset: string,
     *     from: CarbonImmutable,
     *     to: CarbonImmutable,
     *     granularity: 'hour'|'day'|'week'|'month',
     *     finance_period: FinancePeriod|null
     * }
     */
    public function resolveFromRequest(Request $request, ?CarbonImmutable $now = null): array
    {
        $now = ($now ?? CarbonImmutable::now(config('app.timezone')))->startOfSecond();
        $preset = (string) ($request->query('period') ?? $request->query('preset') ?? '30d');

        if ($request->filled('from') || $request->filled('to')) {
            $from = CarbonImmutable::parse((string) $request->query('from'), config('app.timezone'))->startOfDay();
            $to = CarbonImmutable::parse((string) ($request->query('to') ?? $now->toDateString()), config('app.timezone'))->endOfDay();

            if ($to->lessThan($from)) {
                [$from, $to] = [$to->startOfDay(), $from->endOfDay()];
            }

            return [
                'preset' => 'custom',
                'from' => $from,
                'to' => $to,
                'granularity' => $this->granularityForRange($from, $to),
                'finance_period' => null,
            ];
        }

        return match ($preset) {
            'today', 'day' => $this->preset($now, $now->startOfDay(), $now->endOfDay(), 'hour', FinancePeriod::Day, 'today'),
            '7d', 'week' => $this->preset($now, $now->subDays(6)->startOfDay(), $now->endOfDay(), 'day', FinancePeriod::Week, '7d'),
            '30d', 'month' => $this->preset($now, $now->subDays(29)->startOfDay(), $now->endOfDay(), 'day', FinancePeriod::Month, '30d'),
            '90d' => $this->preset($now, $now->subDays(89)->startOfDay(), $now->endOfDay(), 'week', null, '90d'),
            'year' => $this->preset($now, $now->startOfYear(), $now->endOfDay(), 'month', FinancePeriod::Year, 'year'),
            default => $this->preset($now, $now->subDays(29)->startOfDay(), $now->endOfDay(), 'day', FinancePeriod::Month, '30d'),
        };
    }

    /**
     * @return array{preset: string, from: CarbonImmutable, to: CarbonImmutable, granularity: 'hour'|'day'|'week'|'month', finance_period: FinancePeriod|null}
     */
    private function preset(
        CarbonImmutable $now,
        CarbonImmutable $from,
        CarbonImmutable $to,
        string $granularity,
        ?FinancePeriod $financePeriod,
        string $preset,
    ): array {
        return [
            'preset' => $preset,
            'from' => $from,
            'to' => $to->greaterThan($now) ? $now->endOfDay() : $to,
            'granularity' => $granularity,
            'finance_period' => $financePeriod,
        ];
    }

    /**
     * Previous period of equal length immediately before `from`.
     *
     * @return array{from: CarbonImmutable, to: CarbonImmutable}
     */
    public function previousPeriod(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $days = max(1, $from->diffInDays($to) + 1);
        $previousTo = $from->subSecond();
        $previousFrom = $previousTo->subDays($days - 1)->startOfDay();

        return [
            'from' => $previousFrom,
            'to' => $previousTo,
        ];
    }

    private function granularityForRange(CarbonImmutable $from, CarbonImmutable $to): string
    {
        $days = max(1, $from->diffInDays($to) + 1);

        return match (true) {
            $days <= 1 => 'hour',
            $days <= 60 => 'day',
            $days <= 366 => 'week',
            default => 'month',
        };
    }
}
