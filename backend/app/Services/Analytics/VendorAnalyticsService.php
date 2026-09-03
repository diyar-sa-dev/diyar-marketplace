<?php

namespace App\Services\Analytics;

use App\Enums\FinancePeriod;
use App\Enums\FinancialDirection;
use App\Enums\FinancialTransactionType;
use App\Enums\PaymentStatus;
use App\Enums\VendorOrderStatus;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PaymentVendorAllocation;
use App\Models\VendorAccount;
use App\Models\VendorOrder;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

final class VendorAnalyticsService
{
    public function __construct(
        private readonly AnalyticsCache $cache,
        private readonly AnalyticsDateRangeResolver $ranges,
    ) {}

    /**
     * @param  array{preset: string, from: CarbonImmutable, to: CarbonImmutable, granularity: string, finance_period: FinancePeriod|null}  $range
     * @return array<string, mixed>
     */
    public function overview(VendorAccount $vendorAccount, array $range): array
    {
        $ttl = (int) config('diyar.analytics.cache.kpi_seconds', 60);

        return $this->cache->remember(
            'vendor',
            $vendorAccount->id,
            'overview',
            $range['from'],
            $range['to'],
            ['preset' => $range['preset']],
            $ttl,
            fn () => $this->buildOverview($vendorAccount, $range),
        );
    }

    /**
     * @param  array{preset: string, from: CarbonImmutable, to: CarbonImmutable, granularity: string, finance_period: FinancePeriod|null}  $range
     * @return array<string, mixed>
     */
    public function salesSeries(VendorAccount $vendorAccount, array $range): array
    {
        $ttl = (int) config('diyar.analytics.cache.chart_seconds', 180);

        return $this->cache->remember(
            'vendor',
            $vendorAccount->id,
            'sales_series',
            $range['from'],
            $range['to'],
            ['preset' => $range['preset'], 'granularity' => $range['granularity']],
            $ttl,
            fn () => $this->buildSalesSeries($vendorAccount, $range),
        );
    }

    public function products(
        VendorAccount $vendorAccount,
        CarbonImmutable $from,
        CarbonImmutable $to,
        string $sort = 'revenue',
        int $page = 1,
        int $perPage = 20,
    ): LengthAwarePaginator {
        $allowedSort = ['revenue', 'units', 'orders', 'refund_rate'];
        if (! in_array($sort, $allowedSort, true)) {
            $sort = 'revenue';
        }

        $perPage = min(max($perPage, 1), 50);
        $currency = (string) config('diyar.finance.currency', 'SAR');

        $query = OrderItem::query()
            ->selectRaw('order_items.product_id')
            ->selectRaw('MAX(order_items.product_name) as product_name')
            ->selectRaw('SUM(order_items.quantity) as units_sold')
            ->selectRaw('COUNT(DISTINCT order_items.vendor_order_id) as orders_count')
            ->selectRaw('SUM(order_items.line_subtotal) as revenue')
            ->join('vendor_orders', 'vendor_orders.id', '=', 'order_items.vendor_order_id')
            ->where('vendor_orders.vendor_account_id', $vendorAccount->id)
            ->where('vendor_orders.status', VendorOrderStatus::Delivered->value)
            ->whereBetween('vendor_orders.updated_at', [$from, $to])
            ->groupBy('order_items.product_id');

        $orderColumn = match ($sort) {
            'units' => 'units_sold',
            'orders' => 'orders_count',
            default => 'revenue',
        };

        if ($sort === 'refund_rate') {
            // Approximate refund rate via vendor orders with coupon/refund flags is unavailable at item level;
            // fall back to revenue sort for stable pagination.
            $orderColumn = 'revenue';
        }

        return $query
            ->orderByDesc($orderColumn)
            ->paginate($perPage, ['*'], 'page', $page)
            ->through(fn ($row) => [
                'product_id' => $row->product_id,
                'product_name' => $row->product_name,
                'units_sold' => (int) $row->units_sold,
                'orders_count' => (int) $row->orders_count,
                'revenue' => number_format((float) $row->revenue, 2, '.', ''),
                'currency' => $currency,
            ]);
    }

    /**
     * @param  array{preset: string, from: CarbonImmutable, to: CarbonImmutable, granularity: string, finance_period: FinancePeriod|null}  $range
     * @return array<string, mixed>
     */
    private function buildOverview(VendorAccount $vendorAccount, array $range): array
    {
        $currency = (string) config('diyar.finance.currency', 'SAR');
        $current = $this->windowMetrics($vendorAccount->id, $currency, $range['from'], $range['to']);
        $previousRange = $this->ranges->previousPeriod($range['from'], $range['to']);
        $previous = $this->windowMetrics($vendorAccount->id, $currency, $previousRange['from'], $previousRange['to']);

        return [
            'period' => [
                'preset' => $range['preset'],
                'from' => $range['from']->toDateString(),
                'to' => $range['to']->toDateString(),
                'timezone' => config('app.timezone'),
            ],
            'currency' => $currency,
            'kpis' => [
                'gross_sales' => $this->withTrend($current['gross_sales'], $previous['gross_sales']),
                'net_sales' => $this->withTrend($current['net_sales'], $previous['net_sales']),
                'orders' => $this->withTrend($current['orders'], $previous['orders'], false),
                'items_sold' => $this->withTrend($current['items_sold'], $previous['items_sold'], false),
                'average_order_value' => $this->withTrend($current['average_order_value'], $previous['average_order_value']),
                'refund_amount' => $this->withTrend($current['refund_amount'], $previous['refund_amount']),
                'discount_amount' => $this->withTrend($current['discount_amount'], $previous['discount_amount']),
                'coupon_usage' => $this->withTrend($current['coupon_usage'], $previous['coupon_usage'], false),
                'payment_success_rate' => $this->withTrend($current['payment_success_rate'], $previous['payment_success_rate']),
            ],
        ];
    }

    /**
     * @param  array{preset: string, from: CarbonImmutable, to: CarbonImmutable, granularity: string, finance_period: FinancePeriod|null}  $range
     * @return array<string, mixed>
     */
    private function buildSalesSeries(VendorAccount $vendorAccount, array $range): array
    {
        $currency = (string) config('diyar.finance.currency', 'SAR');
        $buckets = AnalyticsTimeBuckets::build($range['from'], $range['to'], $range['granularity']);
        $series = [];

        foreach ($buckets as $bucket) {
            $metrics = $this->windowMetrics(
                $vendorAccount->id,
                $currency,
                $bucket['from'],
                $bucket['to'],
            );

            $series[] = [
                'label' => $bucket['label'],
                'revenue' => $metrics['net_sales'],
                'gross_sales' => $metrics['gross_sales'],
                'orders' => $metrics['orders'],
                'refunds' => $metrics['refund_amount'],
                'average_order_value' => $metrics['average_order_value'],
            ];
        }

        return [
            'period' => [
                'preset' => $range['preset'],
                'from' => $range['from']->toDateString(),
                'to' => $range['to']->toDateString(),
                'granularity' => $range['granularity'],
            ],
            'currency' => $currency,
            'series' => $series,
        ];
    }

    /**
     * @return array{
     *     gross_sales: string,
     *     net_sales: string,
     *     orders: int,
     *     items_sold: int,
     *     average_order_value: string,
     *     refund_amount: string,
     *     discount_amount: string,
     *     coupon_usage: int,
     *     payment_success_rate: string
     * }
     */
    private function windowMetrics(string $vendorAccountId, string $currency, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $allocation = PaymentVendorAllocation::query()
            ->selectRaw('COALESCE(SUM(vendor_gross_total), 0) as gross_total')
            ->selectRaw('COALESCE(SUM(vendor_payable_amount), 0) as payable_total')
            ->where('vendor_account_id', $vendorAccountId)
            ->where('currency', $currency)
            ->whereHas('payment', fn ($query) => $query
                ->where('status', PaymentStatus::Paid->value)
                ->whereBetween('paid_at', [$from, $to]))
            ->first();

        $refunds = DB::table('financial_transactions')
            ->where('vendor_account_id', $vendorAccountId)
            ->where('currency', $currency)
            ->where('direction', FinancialDirection::Debit->value)
            ->where('transaction_type', FinancialTransactionType::Refund->value)
            ->whereBetween('created_at', [$from, $to])
            ->sum('amount');

        $orderStats = VendorOrder::query()
            ->selectRaw('COUNT(*) as orders_count')
            ->selectRaw('COALESCE(SUM(vendor_total), 0) as vendor_total_sum')
            ->selectRaw('COALESCE(SUM(coupon_discount_snapshot), 0) as discount_sum')
            ->selectRaw('SUM(CASE WHEN vendor_coupon_id IS NOT NULL THEN 1 ELSE 0 END) as coupon_orders')
            ->where('vendor_account_id', $vendorAccountId)
            ->where('status', VendorOrderStatus::Delivered->value)
            ->whereBetween('updated_at', [$from, $to])
            ->first();

        $itemsSold = (int) OrderItem::query()
            ->join('vendor_orders', 'vendor_orders.id', '=', 'order_items.vendor_order_id')
            ->where('vendor_orders.vendor_account_id', $vendorAccountId)
            ->where('vendor_orders.status', VendorOrderStatus::Delivered->value)
            ->whereBetween('vendor_orders.updated_at', [$from, $to])
            ->sum('order_items.quantity');

        $orders = (int) ($orderStats->orders_count ?? 0);
        $gross = number_format((float) ($allocation->gross_total ?? 0), 2, '.', '');
        $payable = number_format((float) ($allocation->payable_total ?? 0), 2, '.', '');
        $refundAmount = number_format((float) $refunds, 2, '.', '');
        $net = bcsub($payable, $refundAmount, 2);
        if (bccomp($net, '0.00', 2) < 0) {
            $net = '0.00';
        }

        $average = '0.00';
        if ($orders > 0) {
            $average = number_format((float) ($orderStats->vendor_total_sum ?? 0) / $orders, 2, '.', '');
        }

        $paymentStats = Payment::query()
            ->whereHas('order.vendorOrders', fn ($query) => $query->where('vendor_account_id', $vendorAccountId))
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('COUNT(*) as total')
            ->selectRaw(sprintf("SUM(CASE WHEN status = '%s' THEN 1 ELSE 0 END) as paid", PaymentStatus::Paid->value))
            ->first();

        $paymentTotal = (int) ($paymentStats->total ?? 0);
        $paymentPaid = (int) ($paymentStats->paid ?? 0);
        $successRate = $paymentTotal > 0
            ? number_format(($paymentPaid / $paymentTotal) * 100, 1, '.', '')
            : '0.0';

        return [
            'gross_sales' => $gross,
            'net_sales' => $net,
            'orders' => $orders,
            'items_sold' => $itemsSold,
            'average_order_value' => $average,
            'refund_amount' => $refundAmount,
            'discount_amount' => number_format((float) ($orderStats->discount_sum ?? 0), 2, '.', ''),
            'coupon_usage' => (int) ($orderStats->coupon_orders ?? 0),
            'payment_success_rate' => $successRate,
        ];
    }

    /**
     * @return array{value: string|int, previous_value: string|int, change_percent: ?float}
     */
    private function withTrend(string|int|float $current, string|int|float $previous, bool $isMoney = true): array
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
