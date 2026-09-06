<?php

namespace App\Services\Analytics;

use App\Models\SearchQueryEvent;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

final class SearchAnalyticsQueryService
{
    /**
     * @return array<string, mixed>
     */
    public function summary(CarbonInterface $from, CarbonInterface $to, int $topLimit = 10): array
    {
        $base = SearchQueryEvent::query()->whereBetween('created_at', [$from, $to]);

        $totalSearches = (clone $base)->count();
        $zeroResultSearches = (clone $base)->where('result_count', 0)->count();
        $avgDuration = (clone $base)->avg('duration_ms');

        $topQueries = DB::table('search_query_events')
            ->selectRaw('normalized_query, COUNT(*) as searches, AVG(result_count) as avg_results')
            ->whereBetween('created_at', [$from, $to])
            ->whereNotNull('normalized_query')
            ->where('normalized_query', '!=', '')
            ->groupBy('normalized_query')
            ->orderByDesc('searches')
            ->limit($topLimit)
            ->get()
            ->map(fn ($row) => [
                'query' => $row->normalized_query,
                'searches' => (int) $row->searches,
                'avg_results' => round((float) $row->avg_results, 1),
            ])
            ->all();

        $searchesByDay = DB::table('search_query_events')
            ->selectRaw('DATE(created_at) as day, COUNT(*) as count')
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn ($row) => [
                'day' => $row->day,
                'count' => (int) $row->count,
            ])
            ->all();

        return [
            'period' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'totals' => [
                'searches' => $totalSearches,
                'zero_result_searches' => $zeroResultSearches,
                'zero_result_rate' => $totalSearches > 0
                    ? round(($zeroResultSearches / $totalSearches) * 100, 1)
                    : 0.0,
                'avg_duration_ms' => $avgDuration !== null ? round((float) $avgDuration, 1) : 0.0,
            ],
            'top_queries' => $topQueries,
            'searches_by_day' => $searchesByDay,
        ];
    }
}
