<?php

namespace App\Services\Analytics;

use App\Enums\AnalyticsEventType;
use App\Enums\PaymentStatus;
use App\Enums\PayoutStatus;
use App\Models\AffiliateCommission;
use App\Models\AffiliatePayout;
use App\Models\AnalyticsEvent;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorPayout;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class AdminAnalyticsService
{
    public function __construct(
        private readonly AnalyticsCache $cache,
        private readonly AnalyticsDateRangeResolver $ranges,
        private readonly SearchAnalyticsQueryService $searchAnalytics,
    ) {}

    /**
     * @param  array{preset: string, from: CarbonImmutable, to: CarbonImmutable, granularity: string, finance_period: mixed}  $range
     * @return array<string, mixed>
     */
    public function overview(array $range, bool $includeFinancial = true): array
    {
        $ttl = (int) config('diyar.analytics.cache.platform_seconds', 180);

        return $this->cache->remember(
            'admin',
            'platform',
            $includeFinancial ? 'overview_financial' : 'overview',
            $range['from'],
            $range['to'],
            ['preset' => $range['preset'], 'financial' => $includeFinancial ? 1 : 0],
            $ttl,
            fn () => $this->buildOverview($range, $includeFinancial),
        );
    }

    /**
     * @param  array{preset: string, from: CarbonImmutable, to: CarbonImmutable, granularity: string, finance_period: mixed}  $range
     * @return array<string, mixed>
     */
    public function sales(array $range): array
    {
        $ttl = (int) config('diyar.analytics.cache.chart_seconds', 180);

        return $this->cache->remember(
            'admin',
            'platform',
            'sales',
            $range['from'],
            $range['to'],
            ['preset' => $range['preset'], 'granularity' => $range['granularity']],
            $ttl,
            fn () => $this->buildSales($range),
        );
    }

    /**
     * @param  array{preset: string, from: CarbonImmutable, to: CarbonImmutable, granularity: string, finance_period: mixed}  $range
     * @return array<string, mixed>
     */
    public function funnel(array $range): array
    {
        $ttl = (int) config('diyar.analytics.cache.funnel_seconds', 300);
        $from = $range['from'];
        $to = $range['to'];

        return $this->cache->remember(
            'admin',
            'platform',
            'funnel',
            $from,
            $to,
            ['preset' => $range['preset']],
            $ttl,
            fn () => $this->buildFunnel($from, $to),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function cohorts(int $months = 6): array
    {
        $ttl = (int) config('diyar.analytics.cache.cohort_seconds', 900);
        $months = min(max($months, 3), 12);
        $now = CarbonImmutable::now(config('app.timezone'));

        return $this->cache->remember(
            'admin',
            'platform',
            'cohorts',
            $now->subMonths($months)->startOfMonth(),
            $now->endOfMonth(),
            ['months' => $months],
            $ttl,
            fn () => $this->buildCohorts($months),
        );
    }

    /**
     * @param  array{preset: string, from: CarbonImmutable, to: CarbonImmutable, granularity: string, finance_period: mixed}  $range
     * @return array<string, mixed>
     */
    public function search(array $range): array
    {
        $ttl = (int) config('diyar.analytics.cache.search_seconds', 300);

        return $this->cache->remember(
            'admin',
            'platform',
            'search',
            $range['from'],
            $range['to'],
            ['preset' => $range['preset']],
            $ttl,
            fn () => $this->searchAnalytics->summary($range['from'], $range['to']),
        );
    }

    /**
     * @return Collection<int, object>
     */
    public function exportRows(CarbonImmutable $from, CarbonImmutable $to): Collection
    {
        return DB::table('orders')
            ->join('payments', 'payments.order_id', '=', 'orders.id')
            ->select([
                'orders.id as order_id',
                'orders.order_number',
                'payments.id as payment_id',
                'orders.created_at',
                'orders.grand_total as gross',
                'orders.discount_total as discount',
                'orders.vat_amount as tax',
                'orders.shipping_total as shipping',
                'payments.amount as payment_amount',
                'payments.payment_method',
                'payments.status as payment_status',
                'payments.currency',
                'payments.paid_at',
            ])
            ->whereBetween('orders.created_at', [$from, $to])
            ->orderBy('orders.created_at')
            ->limit(10000)
            ->get();
    }

    /**
     * Legacy summary shape used by admin dashboard.
     *
     * @return array<string, mixed>
     */
    public function legacySummary(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $overview = $this->buildOverview([
            'preset' => 'custom',
            'from' => $from,
            'to' => $to,
            'granularity' => 'day',
            'finance_period' => null,
        ], true);

        return [
            'period' => $overview['period'],
            'totals' => [
                'users' => User::query()->count(),
                'vendors' => VendorAccount::query()->count(),
                'products' => Product::query()->count(),
                'orders' => $overview['kpis']['orders']['value'] ?? 0,
                'order_revenue' => $overview['kpis']['gross_sales']['value'] ?? '0.00',
                'payments' => $overview['kpis']['payments']['value'] ?? 0,
                'payment_volume' => $overview['kpis']['payment_volume']['value'] ?? '0.00',
                'pending_vendor_payouts' => VendorPayout::query()->where('status', PayoutStatus::Pending)->count(),
                'pending_affiliate_payouts' => AffiliatePayout::query()->where('status', PayoutStatus::Pending)->count(),
                'affiliate_commissions' => AffiliateCommission::query()->whereBetween('created_at', [$from, $to])->count(),
            ],
            'orders_by_day' => $this->ordersByDay($from, $to),
        ];
    }

    /**
     * @param  array{preset: string, from: CarbonImmutable, to: CarbonImmutable, granularity: string, finance_period: mixed}  $range
     * @return array<string, mixed>
     */
    private function buildOverview(array $range, bool $includeFinancial): array
    {
        $from = $range['from'];
        $to = $range['to'];

        $ordersQuery = Order::query()->whereBetween('created_at', [$from, $to]);
        $paymentsQuery = Payment::query()->whereBetween('created_at', [$from, $to]);

        $orders = (clone $ordersQuery)->count();
        $grossSales = number_format((float) (clone $ordersQuery)->sum('grand_total'), 2, '.', '');
        $discountTotal = number_format((float) (clone $ordersQuery)->sum('discount_total'), 2, '.', '');
        $refunds = number_format((float) DB::table('refunds')->whereBetween('created_at', [$from, $to])->sum('total_amount'), 2, '.', '');

        $payments = (clone $paymentsQuery)->count();
        $paidPayments = (clone $paymentsQuery)->where('status', PaymentStatus::Paid->value)->count();
        $paymentVolume = number_format((float) (clone $paymentsQuery)->whereNotNull('paid_at')->sum('amount'), 2, '.', '');
        $successRate = $payments > 0
            ? number_format(($paidPayments / $payments) * 100, 1, '.', '')
            : '0.0';

        $averageOrderValue = '0.00';
        if ($orders > 0) {
            $averageOrderValue = number_format((float) (clone $ordersQuery)->avg('grand_total'), 2, '.', '');
        }

        $previousRange = $this->ranges->previousPeriod($from, $to);
        $previousOrders = Order::query()->whereBetween('created_at', [$previousRange['from'], $previousRange['to']])->count();
        $previousGross = Order::query()->whereBetween('created_at', [$previousRange['from'], $previousRange['to']])->sum('grand_total');

        $payload = [
            'period' => [
                'preset' => $range['preset'],
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'timezone' => config('app.timezone'),
            ],
            'currency' => (string) config('diyar.finance.currency', 'SAR'),
            'kpis' => [
                'orders' => $this->trend($orders, $previousOrders, false),
                'gross_sales' => $this->trend($grossSales, number_format((float) $previousGross, 2, '.', '')),
                'discount_amount' => ['value' => $discountTotal, 'previous_value' => null, 'change_percent' => null],
                'refund_amount' => ['value' => $refunds, 'previous_value' => null, 'change_percent' => null],
                'average_order_value' => ['value' => $averageOrderValue, 'previous_value' => null, 'change_percent' => null],
                'payments' => ['value' => $payments, 'previous_value' => null, 'change_percent' => null],
                'payment_volume' => ['value' => $paymentVolume, 'previous_value' => null, 'change_percent' => null],
                'payment_success_rate' => ['value' => $successRate, 'previous_value' => null, 'change_percent' => null],
            ],
        ];

        if (! $includeFinancial) {
            unset($payload['kpis']['payment_volume'], $payload['kpis']['gross_sales']);
        }

        return $payload;
    }

    /**
     * @param  array{preset: string, from: CarbonImmutable, to: CarbonImmutable, granularity: string, finance_period: mixed}  $range
     * @return array<string, mixed>
     */
    private function buildSales(array $range): array
    {
        $rows = $this->ordersByDay($range['from'], $range['to']);

        return [
            'period' => [
                'preset' => $range['preset'],
                'from' => $range['from']->toDateString(),
                'to' => $range['to']->toDateString(),
            ],
            'currency' => (string) config('diyar.finance.currency', 'SAR'),
            'series' => array_map(static fn (array $row) => [
                'label' => $row['day'],
                'orders' => $row['count'],
                'revenue' => $row['revenue'],
            ], $rows),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildFunnel(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $productViews = AnalyticsEvent::query()
            ->where('event_type', AnalyticsEventType::ProductViewed->value)
            ->whereBetween('created_at', [$from, $to])
            ->count();

        $addToCartEvents = AnalyticsEvent::query()
            ->where('event_type', AnalyticsEventType::AddToCart->value)
            ->whereBetween('created_at', [$from, $to])
            ->count();

        $addToCartFallback = CartItem::query()->whereBetween('created_at', [$from, $to])->count();
        $addToCart = max($addToCartEvents, $addToCartFallback);

        $checkoutStartedEvents = AnalyticsEvent::query()
            ->where('event_type', AnalyticsEventType::CheckoutStarted->value)
            ->whereBetween('created_at', [$from, $to])
            ->count();

        $ordersCreated = Order::query()->whereBetween('created_at', [$from, $to])->count();
        $paymentsInitiated = Payment::query()->whereBetween('created_at', [$from, $to])->count();
        $paymentsCompleted = Payment::query()
            ->where('status', PaymentStatus::Paid->value)
            ->whereBetween('paid_at', [$from, $to])
            ->count();

        $stages = [
            [
                'key' => 'product_views',
                'label_key' => 'diyar.analytics.funnel.product_views',
                'count' => $productViews,
                'available' => $productViews > 0,
            ],
            [
                'key' => 'add_to_cart',
                'label_key' => 'diyar.analytics.funnel.add_to_cart',
                'count' => $addToCart,
                'available' => true,
            ],
            [
                'key' => 'checkout_started',
                'label_key' => 'diyar.analytics.funnel.checkout_started',
                'count' => $checkoutStartedEvents,
                'available' => $checkoutStartedEvents > 0,
                'note' => $checkoutStartedEvents > 0
                    ? null
                    : 'Measured from checkout preview events; unavailable until shoppers reach checkout.',
            ],
            [
                'key' => 'order_created',
                'label_key' => 'diyar.analytics.funnel.order_created',
                'count' => $ordersCreated,
                'available' => true,
            ],
            [
                'key' => 'payment_initiated',
                'label_key' => 'diyar.analytics.funnel.payment_initiated',
                'count' => $paymentsInitiated,
                'available' => true,
            ],
            [
                'key' => 'payment_completed',
                'label_key' => 'diyar.analytics.funnel.payment_completed',
                'count' => $paymentsCompleted,
                'available' => true,
            ],
        ];

        foreach ($stages as $index => &$stage) {
            if ($index === 0 || ! ($stages[$index - 1]['available'] ?? false) || ($stages[$index - 1]['count'] ?? 0) <= 0) {
                $stage['conversion_from_previous'] = null;

                continue;
            }

            $previousCount = (int) $stages[$index - 1]['count'];
            $stage['conversion_from_previous'] = $previousCount > 0
                ? round(((int) $stage['count'] / $previousCount) * 100, 1)
                : null;
        }
        unset($stage);

        return [
            'period' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'stages' => $stages,
            'unavailable' => array_values(array_filter($stages, static fn (array $stage) => ! $stage['available'])),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildCohorts(int $months): array
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            return [
                'months' => $months,
                'metric' => 'repeat_customers',
                'cohorts' => [],
                'note' => 'Cohort retention requires MySQL in production; SQLite returns an empty matrix.',
            ];
        }

        $now = CarbonImmutable::now(config('app.timezone'));
        $start = $now->subMonths($months - 1)->startOfMonth();

        $firstOrders = DB::table('orders')
            ->selectRaw('user_id, DATE_FORMAT(MIN(created_at), "%Y-%m") as cohort_month')
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->havingRaw('MIN(created_at) >= ?', [$start->toDateTimeString()]);

        $rows = DB::query()
            ->fromSub($firstOrders, 'cohorts')
            ->join('orders', 'orders.user_id', '=', 'cohorts.user_id')
            ->selectRaw('cohorts.cohort_month')
            ->selectRaw('TIMESTAMPDIFF(MONTH, STR_TO_DATE(CONCAT(cohorts.cohort_month, "-01"), "%Y-%m-%d"), DATE(orders.created_at)) as month_offset')
            ->selectRaw('COUNT(DISTINCT orders.user_id) as customers')
            ->selectRaw('COUNT(orders.id) as orders')
            ->selectRaw('COALESCE(SUM(orders.grand_total), 0) as revenue')
            ->groupBy('cohorts.cohort_month', 'month_offset')
            ->orderBy('cohorts.cohort_month')
            ->orderBy('month_offset')
            ->get();

        $matrix = [];
        foreach ($rows as $row) {
            $cohort = $row->cohort_month;
            $offset = (int) $row->month_offset;
            if ($offset < 0 || $offset >= $months) {
                continue;
            }
            $matrix[$cohort]['customers'][$offset] = (int) $row->customers;
            $matrix[$cohort]['orders'][$offset] = (int) $row->orders;
            $matrix[$cohort]['revenue'][$offset] = number_format((float) $row->revenue, 2, '.', '');
        }

        return [
            'months' => $months,
            'metric' => 'repeat_customers',
            'cohorts' => $matrix,
            'note' => 'Retention counts distinct customers with at least one order in offset month.',
        ];
    }

    /** @return list<array{day: string, count: int, revenue: string}> */
    private function ordersByDay(CarbonImmutable $from, CarbonImmutable $to): array
    {
        return DB::table('orders')
            ->selectRaw('DATE(created_at) as day, COUNT(*) as count, SUM(grand_total) as revenue')
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn ($row) => [
                'day' => $row->day,
                'count' => (int) $row->count,
                'revenue' => number_format((float) $row->revenue, 2, '.', ''),
            ])
            ->all();
    }

    /**
     * @return array{value: string|int, previous_value: string|int, change_percent: ?float}
     */
    private function trend(string|int|float $current, string|int|float $previous, bool $isMoney = true): array
    {
        $currentValue = $isMoney ? (string) $current : (int) $current;
        $previousValue = $isMoney ? (string) $previous : (int) $previous;
        $currentFloat = (float) $current;
        $previousFloat = (float) $previous;
        $change = null;

        if ($previousFloat > 0) {
            $change = round((($currentFloat - $previousFloat) / $previousFloat) * 100, 1);
        } elseif ($currentFloat > 0) {
            $change = 100.0;
        }

        return [
            'value' => $currentValue,
            'previous_value' => $previousValue,
            'change_percent' => $change,
        ];
    }
}
