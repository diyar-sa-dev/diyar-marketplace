<?php

namespace App\Services\Affiliate;

use App\Enums\AffiliateCommissionStatus;
use App\Models\AffiliateClick;
use App\Models\AffiliateCommission;
use App\Models\AffiliateLink;
use App\Models\AffiliateProfile;
use App\Models\ProductAffiliateSetting;
use App\Models\User;
use App\Services\Media\MediaUploadService;
use App\Support\Database\SqlDialect;
use App\Support\Vendor\VendorOwnership;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;

final class AffiliateDashboardService
{
    public function __construct(
        private readonly AffiliateBalanceService $balances,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function overview(AffiliateProfile $profile, Carbon $from, Carbon $to): array
    {
        $cacheKey = $this->cacheKey($profile->id, 'overview', $from, $to);
        $ttl = (int) config('diyar.affiliate.cache_dashboard_seconds', 120);

        return Cache::remember($cacheKey, $ttl, function () use ($profile, $from, $to) {
            $clicks = $this->countClicks($profile, $from, $to);
            $conversions = $this->countConversions($profile, $from, $to);

            return [
                'balance' => $this->balances->summary($profile),
                'clicks' => $clicks,
                'conversions' => $conversions,
                'conversion_rate' => $this->conversionRate($clicks, $conversions),
                'earnings' => $this->sumEarnings($profile, $from, $to),
                'active_links' => AffiliateLink::query()
                    ->where('affiliate_profile_id', $profile->id)
                    ->where('is_active', true)
                    ->count(),
                'period' => [
                    'from' => $from->toDateString(),
                    'to' => $to->toDateString(),
                ],
                'chart' => $this->monthlySeries($profile, 5),
                'top_links' => $this->topLinks($profile, $from, $to, 3),
            ];
        });
    }

    public function promotableProducts(User $user, int $perPage = 20, int $page = 1, ?string $search = null): LengthAwarePaginator
    {
        $ownedVendorId = app(VendorOwnership::class)->userVendorAccountId($user);

        $query = ProductAffiliateSetting::query()
            ->with([
                'product.vendorAccount:id,business_name,slug',
                'product.images.mediaFile',
            ])
            ->where('enabled', true);

        if ($ownedVendorId !== null) {
            $query->whereHas('product', fn (Builder $builder) => $builder->where('vendor_account_id', '!=', $ownedVendorId));
        }

        if ($search !== null && trim($search) !== '') {
            $needle = '%'.trim($search).'%';
            $query->whereHas('product', function (Builder $builder) use ($needle) {
                $builder->where('name', 'like', $needle)
                    ->orWhereHas('vendorAccount', fn (Builder $vendor) => $vendor->where('business_name', 'like', $needle));
            });
        }

        return $query
            ->latest()
            ->paginate(min(max($perPage, 1), 50), ['*'], 'page', max($page, 1));
    }

    /**
     * @return list<array{source: string, clicks: int, conversions: int, conversion_rate: string, earnings: string}>
     */
    public function reportBySource(AffiliateProfile $profile, Carbon $from, Carbon $to): array
    {
        $sourceExpr = SqlDialect::trafficSourceExpression('traffic_source');

        $clickRows = AffiliateClick::query()
            ->selectRaw("{$sourceExpr} as source, COUNT(*) as total")
            ->where('affiliate_profile_id', $profile->id)
            ->whereBetween('created_at', [$from, $to])
            ->groupByRaw($sourceExpr)
            ->pluck('total', 'source');

        $conversionRows = AffiliateCommission::query()
            ->selectRaw("{$sourceExpr} as source, COUNT(*) as total, SUM(commission_amount) as earnings")
            ->where('affiliate_profile_id', $profile->id)
            ->whereBetween('created_at', [$from, $to])
            ->whereNotIn('status', [
                AffiliateCommissionStatus::Reversed->value,
                AffiliateCommissionStatus::Cancelled->value,
            ])
            ->groupByRaw($sourceExpr)
            ->get()
            ->keyBy('source');

        $sources = $clickRows->keys()
            ->merge($conversionRows->keys())
            ->unique()
            ->sort()
            ->values();

        return $sources->map(function (string $source) use ($clickRows, $conversionRows) {
            $clicks = (int) ($clickRows[$source] ?? 0);
            $conversion = $conversionRows->get($source);
            $conversions = (int) ($conversion->total ?? 0);

            return [
                'source' => $source,
                'clicks' => $clicks,
                'conversions' => $conversions,
                'conversion_rate' => $this->conversionRate($clicks, $conversions),
                'earnings' => number_format((float) ($conversion->earnings ?? 0), 2, '.', ''),
            ];
        })->sortByDesc('conversions')->values()->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function reportByLink(
        AffiliateProfile $profile,
        Carbon $from,
        Carbon $to,
        ?string $sort = 'earnings',
        int $limit = 50,
    ): array {
        $clickSub = AffiliateClick::query()
            ->selectRaw('COUNT(*)')
            ->whereColumn('affiliate_link_id', 'affiliate_links.id')
            ->whereBetween('created_at', [$from, $to]);

        $conversionSub = AffiliateCommission::query()
            ->selectRaw('COUNT(*)')
            ->whereColumn('affiliate_link_id', 'affiliate_links.id')
            ->where('affiliate_profile_id', $profile->id)
            ->whereBetween('created_at', [$from, $to]);

        $earningsSub = AffiliateCommission::query()
            ->selectRaw('COALESCE(SUM(commission_amount), 0)')
            ->whereColumn('affiliate_link_id', 'affiliate_links.id')
            ->where('affiliate_profile_id', $profile->id)
            ->whereBetween('created_at', [$from, $to])
            ->whereNotIn('status', [
                AffiliateCommissionStatus::Reversed->value,
                AffiliateCommissionStatus::Cancelled->value,
            ]);

        $sortColumn = match ($sort) {
            'clicks' => 'period_clicks',
            'conversions' => 'period_conversions',
            default => 'period_earnings',
        };

        $rows = AffiliateLink::query()
            ->with(['product:id,name,slug', 'product.images.mediaFile'])
            ->where('affiliate_profile_id', $profile->id)
            ->select('affiliate_links.*')
            ->selectSub($clickSub, 'period_clicks')
            ->selectSub($conversionSub, 'period_conversions')
            ->selectSub($earningsSub, 'period_earnings')
            ->orderByDesc($sortColumn)
            ->limit(min(max($limit, 1), 100))
            ->get();

        $media = app(MediaUploadService::class);

        return $rows->map(function (AffiliateLink $link) use ($media) {
            $firstImage = $link->product?->images?->first();

            return [
                'link_id' => $link->id,
                'name' => $link->name,
                'referral_code' => $link->referral_code,
                'public_url' => app(AffiliateLinkService::class)->buildPublicUrl($link),
                'product' => [
                    'id' => $link->product_id,
                    'name' => $link->product?->name,
                    'slug' => $link->product?->slug,
                    'image_url' => $firstImage?->relationLoaded('mediaFile') && $firstImage->mediaFile !== null
                        ? $media->url($firstImage->mediaFile->path)
                        : null,
                ],
                'clicks' => (int) $link->period_clicks,
                'conversions' => (int) $link->period_conversions,
                'earnings' => number_format((float) $link->period_earnings, 2, '.', ''),
                'is_active' => $link->is_active,
            ];
        })->values()->all();
    }

    /**
     * @return list<array{period: string, clicks: int, conversions: int, commission: string}>
     */
    public function monthlySeries(AffiliateProfile $profile, int $months = 5): array
    {
        $months = min(max($months, 1), 12);
        $from = now()->subMonths($months - 1)->startOfMonth();
        $to = now()->endOfMonth();

        $monthPeriod = SqlDialect::monthPeriodExpression('created_at');

        $clickRows = AffiliateClick::query()
            ->selectRaw("{$monthPeriod} as period, COUNT(*) as total")
            ->where('affiliate_profile_id', $profile->id)
            ->whereBetween('created_at', [$from, $to])
            ->groupByRaw($monthPeriod)
            ->pluck('total', 'period');

        $conversionRows = AffiliateCommission::query()
            ->selectRaw("{$monthPeriod} as period, COUNT(*) as total, SUM(commission_amount) as earnings")
            ->where('affiliate_profile_id', $profile->id)
            ->whereBetween('created_at', [$from, $to])
            ->whereNotIn('status', [AffiliateCommissionStatus::Reversed->value, AffiliateCommissionStatus::Cancelled->value])
            ->groupByRaw($monthPeriod)
            ->get()
            ->keyBy('period');

        $series = [];
        $cursor = $from->copy();

        while ($cursor->lte($to)) {
            $period = $cursor->format('Y-m');
            $conversion = $conversionRows->get($period);

            $series[] = [
                'period' => $period,
                'clicks' => (int) ($clickRows[$period] ?? 0),
                'conversions' => (int) ($conversion->total ?? 0),
                'commission' => number_format((float) ($conversion->earnings ?? 0), 2, '.', ''),
            ];

            $cursor->addMonth();
        }

        return $series;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function topLinks(AffiliateProfile $profile, Carbon $from, Carbon $to, int $limit = 3): array
    {
        return array_slice(
            $this->reportByLink($profile, $from, $to, 'earnings', $limit),
            0,
            $limit,
        );
    }

    /**
     * @return array{
     *     clicks: int,
     *     conversions: int,
     *     conversion_rate: string,
     *     earnings: string,
     *     pending_commissions: string,
     *     available_commissions: string,
     *     paid_commissions: string,
     *     reversed_commissions: string
     * }
     */
    public function reportSummary(AffiliateProfile $profile, Carbon $from, Carbon $to): array
    {
        $clicks = $this->countClicks($profile, $from, $to);
        $conversions = $this->countConversions($profile, $from, $to);

        $commissionQuery = AffiliateCommission::query()
            ->where('affiliate_profile_id', $profile->id)
            ->whereBetween('created_at', [$from, $to]);

        $sumFor = function (array $statuses) use ($commissionQuery): string {
            $sum = (clone $commissionQuery)
                ->whereIn('status', $statuses)
                ->sum('commission_amount');

            return number_format((float) $sum, 2, '.', '');
        };

        return [
            'clicks' => $clicks,
            'conversions' => $conversions,
            'conversion_rate' => $this->conversionRate($clicks, $conversions),
            'earnings' => $this->sumEarnings($profile, $from, $to),
            'pending_commissions' => $sumFor([
                AffiliateCommissionStatus::Pending->value,
                AffiliateCommissionStatus::Approved->value,
            ]),
            'available_commissions' => $sumFor([AffiliateCommissionStatus::Available->value]),
            'paid_commissions' => $sumFor([AffiliateCommissionStatus::Paid->value]),
            'reversed_commissions' => $sumFor([
                AffiliateCommissionStatus::Reversed->value,
                AffiliateCommissionStatus::Cancelled->value,
            ]),
        ];
    }

    /**
     * @return list<array{date: string, clicks: int, conversions: int, earnings: string}>
     */
    public function dailySeries(AffiliateProfile $profile, Carbon $from, Carbon $to): array
    {
        $dayExpr = SqlDialect::dayPeriodExpression('created_at');

        $clickRows = AffiliateClick::query()
            ->selectRaw("{$dayExpr} as day, COUNT(*) as total")
            ->where('affiliate_profile_id', $profile->id)
            ->whereBetween('created_at', [$from, $to])
            ->groupByRaw($dayExpr)
            ->pluck('total', 'day');

        $conversionRows = AffiliateCommission::query()
            ->selectRaw("{$dayExpr} as day, COUNT(*) as total, SUM(commission_amount) as earnings")
            ->where('affiliate_profile_id', $profile->id)
            ->whereBetween('created_at', [$from, $to])
            ->whereNotIn('status', [AffiliateCommissionStatus::Reversed->value, AffiliateCommissionStatus::Cancelled->value])
            ->groupByRaw($dayExpr)
            ->get()
            ->keyBy('day');

        $series = [];
        $cursor = $from->copy()->startOfDay();

        while ($cursor->lte($to)) {
            $day = $cursor->toDateString();
            $conversion = $conversionRows->get($day);

            $series[] = [
                'date' => $day,
                'clicks' => (int) ($clickRows[$day] ?? 0),
                'conversions' => (int) ($conversion->total ?? 0),
                'earnings' => number_format((float) ($conversion->earnings ?? 0), 2, '.', ''),
            ];

            $cursor->addDay();
        }

        return $series;
    }

    public static function bustDashboardCache(AffiliateProfile $profile): void
    {
        Cache::increment("diyar:affiliate:cache-v:{$profile->id}");
    }

    public static function resolvePeriodRange(?string $period, ?string $from, ?string $to): array
    {
        if (is_string($from) && is_string($to)) {
            return [Carbon::parse($from)->startOfDay(), Carbon::parse($to)->endOfDay()];
        }

        $end = now()->endOfDay();

        return match ($period) {
            'day' => [now()->startOfDay(), $end],
            'week' => [now()->subDays(6)->startOfDay(), $end],
            '3m' => [now()->subMonths(3)->startOfDay(), $end],
            '6m' => [now()->subMonths(6)->startOfDay(), $end],
            '12m', 'year' => [now()->subYear()->startOfDay(), $end],
            default => [now()->subDays(29)->startOfDay(), $end],
        };
    }

    public static function currentMonthRange(): array
    {
        return [now()->startOfMonth(), now()->endOfMonth()];
    }

    private function conversionRate(int $clicks, int $conversions): string
    {
        if ($clicks <= 0) {
            return '0.00';
        }

        return number_format(($conversions / $clicks) * 100, 2, '.', '');
    }

    private function countClicks(AffiliateProfile $profile, Carbon $from, Carbon $to): int
    {
        return AffiliateClick::query()
            ->where('affiliate_profile_id', $profile->id)
            ->whereBetween('created_at', [$from, $to])
            ->count();
    }

    private function countConversions(AffiliateProfile $profile, Carbon $from, Carbon $to): int
    {
        return AffiliateCommission::query()
            ->where('affiliate_profile_id', $profile->id)
            ->whereBetween('created_at', [$from, $to])
            ->count();
    }

    private function sumEarnings(AffiliateProfile $profile, Carbon $from, Carbon $to): string
    {
        $sum = AffiliateCommission::query()
            ->where('affiliate_profile_id', $profile->id)
            ->whereBetween('created_at', [$from, $to])
            ->whereNotIn('status', [AffiliateCommissionStatus::Reversed->value, AffiliateCommissionStatus::Cancelled->value])
            ->sum('commission_amount');

        return number_format((float) $sum, 2, '.', '');
    }

    private function cacheKey(string $profileId, string $section, Carbon $from, Carbon $to): string
    {
        $version = (int) Cache::get("diyar:affiliate:cache-v:{$profileId}", 0);

        return implode(':', [
            'diyar:affiliate:dashboard',
            $profileId,
            'v'.$version,
            $section,
            $from->toDateString(),
            $to->toDateString(),
        ]);
    }
}
