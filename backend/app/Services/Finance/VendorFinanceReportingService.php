<?php

namespace App\Services\Finance;

use App\Enums\FinancePeriod;
use App\Enums\FinancialDirection;
use App\Enums\FinancialTransactionType;
use App\Enums\PaymentStatus;
use App\Enums\PayoutStatus;
use App\Enums\VendorOrderStatus;
use App\Models\FinancialTransaction;
use App\Models\PaymentVendorAllocation;
use App\Models\VendorAccount;
use App\Models\VendorOrder;
use App\Models\VendorPayout;
use App\Services\Finance\DTO\VendorFinanceAnalyticsPoint;
use App\Services\Finance\DTO\VendorFinancePeriodReport;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

final class VendorFinanceReportingService
{
    public function __construct(
        private readonly VendorBalanceService $balances,
        private readonly VendorFinancePeriodResolver $periods,
    ) {}

    public function periodReport(VendorAccount $vendorAccount, FinancePeriod $period, ?string $currency = null): VendorFinancePeriodReport
    {
        $currency = $currency ?? (string) config('diyar.finance.currency', 'SAR');
        $window = $this->periods->resolve($period);
        $from = $window['from'];
        $to = $window['to'];

        $allocationStats = $this->allocationStatsForWindow($vendorAccount->id, $currency, $from, $to);
        $refunds = $this->sumVendorTransactions(
            $vendorAccount->id,
            $currency,
            $from,
            $to,
            [FinancialTransactionType::Refund],
            FinancialDirection::Debit,
        );
        $adjustments = $this->sumVendorTransactions(
            $vendorAccount->id,
            $currency,
            $from,
            $to,
            [FinancialTransactionType::Adjustment],
            FinancialDirection::Debit,
        );

        $adjustmentCredits = $this->sumVendorTransactions(
            $vendorAccount->id,
            $currency,
            $from,
            $to,
            [FinancialTransactionType::Adjustment],
            FinancialDirection::Credit,
        );
        $adjustments = bcsub($adjustments, $adjustmentCredits, 2);

        $netEarnings = bcsub(
            bcsub($allocationStats['payable'], $refunds, 2),
            bccomp($adjustments, '0.00', 2) > 0 ? $adjustments : '0.00',
            2,
        );

        if (bccomp($netEarnings, '0.00', 2) < 0) {
            $netEarnings = '0.00';
        }

        $orderStats = $this->orderStatsForWindow($vendorAccount->id, $from, $to);
        $balanceSummary = $this->balances->summary($vendorAccount, $currency);
        $upcoming = $this->resolveUpcomingPayout($vendorAccount, $currency);

        return new VendorFinancePeriodReport(
            periodType: $period,
            from: $from,
            to: $to,
            currency: $currency,
            grossSales: $allocationStats['gross'],
            commission: $allocationStats['commission'],
            commissionBase: $allocationStats['commission_base'],
            commissionRatePercent: $allocationStats['commission_rate_percent'],
            refunds: $refunds,
            adjustments: bccomp($adjustments, '0.00', 2) > 0 ? $adjustments : '0.00',
            netEarnings: $netEarnings,
            pendingEscrow: $balanceSummary->pendingEscrow,
            availableBalance: $balanceSummary->availableBalance,
            paidOut: $balanceSummary->paidOut,
            completedOrders: $orderStats['completed'],
            averageOrderValue: $orderStats['average'],
            upcomingPayoutAmount: $upcoming['amount'],
            upcomingPayoutDueAt: $upcoming['due_at'],
            upcomingPayoutNote: $upcoming['note'],
        );
    }

    /**
     * @return list<VendorFinanceAnalyticsPoint>
     */
    public function analytics(VendorAccount $vendorAccount, FinancePeriod $period, ?string $currency = null): array
    {
        $currency = $currency ?? (string) config('diyar.finance.currency', 'SAR');
        $window = $this->periods->resolve($period);
        $from = $window['from'];
        $to = $window['to'];

        $buckets = $this->buildAnalyticsBuckets($period, $from, $to);
        $points = [];

        foreach ($buckets as $bucket) {
            /** @var CarbonImmutable $bucketFrom */
            $bucketFrom = $bucket['from'];
            /** @var CarbonImmutable $bucketTo */
            $bucketTo = $bucket['to'];

            $stats = $this->allocationStatsForWindow($vendorAccount->id, $currency, $bucketFrom, $bucketTo);
            $refunds = $this->sumVendorTransactions(
                $vendorAccount->id,
                $currency,
                $bucketFrom,
                $bucketTo,
                [FinancialTransactionType::Refund],
                FinancialDirection::Debit,
            );

            $net = bcsub($stats['payable'], $refunds, 2);
            if (bccomp($net, '0.00', 2) < 0) {
                $net = '0.00';
            }

            $points[] = new VendorFinanceAnalyticsPoint(
                label: $bucket['label'],
                netEarnings: $net,
                commission: $stats['commission'],
                grossSales: $stats['gross'],
            );
        }

        return $points;
    }

    /**
     * @return array{gross: string, commission: string, payable: string, commission_base: string, commission_rate_percent: ?string}
     */
    private function allocationStatsForWindow(
        string $vendorAccountId,
        string $currency,
        CarbonImmutable $from,
        CarbonImmutable $to,
    ): array {
        $row = PaymentVendorAllocation::query()
            ->selectRaw('COALESCE(SUM(vendor_gross_total), 0) as gross_total')
            ->selectRaw('COALESCE(SUM(vendor_subtotal), 0) as subtotal_total')
            ->selectRaw('COALESCE(SUM(platform_commission_amount), 0) as commission_total')
            ->selectRaw('COALESCE(SUM(vendor_payable_amount), 0) as payable_total')
            ->where('vendor_account_id', $vendorAccountId)
            ->where('currency', $currency)
            ->whereHas('payment', function ($query) use ($from, $to) {
                $query->where('status', PaymentStatus::Paid->value)
                    ->whereBetween('paid_at', [$from, $to]);
            })
            ->first();

        $commissionBase = number_format((float) ($row?->subtotal_total ?? 0), 2, '.', '');
        $commission = number_format((float) ($row?->commission_total ?? 0), 2, '.', '');
        $commissionRatePercent = null;

        if (bccomp($commissionBase, '0.00', 2) > 0) {
            $commissionRatePercent = bcdiv(
                bcmul($commission, '100', 4),
                $commissionBase,
                1,
            );
        }

        return [
            'gross' => number_format((float) ($row?->gross_total ?? 0), 2, '.', ''),
            'commission' => $commission,
            'payable' => number_format((float) ($row?->payable_total ?? 0), 2, '.', ''),
            'commission_base' => $commissionBase,
            'commission_rate_percent' => $commissionRatePercent,
        ];
    }

    /**
     * @param  list<FinancialTransactionType>  $types
     */
    private function sumVendorTransactions(
        string $vendorAccountId,
        string $currency,
        CarbonImmutable $from,
        CarbonImmutable $to,
        array $types,
        FinancialDirection $direction,
    ): string {
        $sum = FinancialTransaction::query()
            ->where('vendor_account_id', $vendorAccountId)
            ->where('currency', $currency)
            ->where('direction', $direction->value)
            ->whereIn('transaction_type', array_map(static fn (FinancialTransactionType $type) => $type->value, $types))
            ->whereBetween('created_at', [$from, $to])
            ->sum('amount');

        return number_format((float) $sum, 2, '.', '');
    }

    /**
     * @return array{completed: int, average: string}
     */
    private function orderStatsForWindow(string $vendorAccountId, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $query = VendorOrder::query()
            ->where('vendor_account_id', $vendorAccountId)
            ->where('status', VendorOrderStatus::Delivered->value)
            ->whereBetween('updated_at', [$from, $to]);

        $completed = (clone $query)->count();
        $average = '0.00';

        if ($completed > 0) {
            $average = number_format((float) (clone $query)->avg('vendor_total'), 2, '.', '');
        }

        return [
            'completed' => $completed,
            'average' => $average,
        ];
    }

    /**
     * @return array{amount: ?string, due_at: ?string, note: ?string}
     */
    private function resolveUpcomingPayout(VendorAccount $vendorAccount, string $currency): array
    {
        $pendingPayout = VendorPayout::query()
            ->where('vendor_account_id', $vendorAccount->id)
            ->where('currency', $currency)
            ->whereIn('status', [
                PayoutStatus::Pending->value,
                PayoutStatus::Approved->value,
                PayoutStatus::Processing->value,
            ])
            ->orderBy('requested_at')
            ->first();

        if ($pendingPayout !== null) {
            return [
                'amount' => number_format((float) $pendingPayout->amount, 2, '.', ''),
                'due_at' => $pendingPayout->requested_at?->toIso8601String(),
                'note' => null,
            ];
        }

        $balance = $this->balances->summary($vendorAccount, $currency);

        if (bccomp($balance->pendingEscrow, '0.00', 2) > 0) {
            return [
                'amount' => $balance->pendingEscrow,
                'due_at' => null,
                'note' => __('diyar.finance.upcoming_escrow_note'),
            ];
        }

        return [
            'amount' => null,
            'due_at' => null,
            'note' => __('diyar.finance.no_upcoming_payout'),
        ];
    }

    /**
     * @return list<array{label: string, from: CarbonImmutable, to: CarbonImmutable}>
     */
    private function buildAnalyticsBuckets(FinancePeriod $period, CarbonImmutable $from, CarbonImmutable $to): array
    {
        return match ($period) {
            FinancePeriod::Day => $this->hourlyBuckets($from, $to),
            FinancePeriod::Week => $this->dailyBuckets($from, $to),
            FinancePeriod::Month => $this->dailyBuckets($from, $to),
            FinancePeriod::Year => $this->monthlyBuckets($from, $to),
        };
    }

    /**
     * @return list<array{label: string, from: CarbonImmutable, to: CarbonImmutable}>
     */
    private function hourlyBuckets(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $buckets = [];
        $cursor = $from->startOfHour();

        while ($cursor <= $to) {
            $bucketEnd = $cursor->endOfHour();
            if ($bucketEnd > $to) {
                $bucketEnd = $to;
            }

            $buckets[] = [
                'label' => $cursor->format('H:i'),
                'from' => $cursor,
                'to' => $bucketEnd,
            ];

            $cursor = $cursor->addHour();
        }

        return $buckets;
    }

    /**
     * @return list<array{label: string, from: CarbonImmutable, to: CarbonImmutable}>
     */
    private function dailyBuckets(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $buckets = [];
        $cursor = $from->startOfDay();

        while ($cursor <= $to) {
            $bucketEnd = $cursor->endOfDay();
            if ($bucketEnd > $to) {
                $bucketEnd = $to;
            }

            $buckets[] = [
                'label' => $cursor->format('Y-m-d'),
                'from' => $cursor,
                'to' => $bucketEnd,
            ];

            $cursor = $cursor->addDay();
        }

        return $buckets;
    }

    /**
     * @return list<array{label: string, from: CarbonImmutable, to: CarbonImmutable}>
     */
    private function monthlyBuckets(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $buckets = [];
        $cursor = $from->startOfMonth();

        while ($cursor <= $to) {
            $bucketEnd = $cursor->endOfMonth();
            if ($bucketEnd > $to) {
                $bucketEnd = $to;
            }

            $buckets[] = [
                'label' => $cursor->format('Y-m'),
                'from' => $cursor,
                'to' => $bucketEnd,
            ];

            $cursor = $cursor->addMonth();
        }

        return $buckets;
    }

    /**
     * @return Collection<int, FinancialTransaction>
     */
    public function transactionsForExport(
        VendorAccount $vendorAccount,
        FinancePeriod $period,
        ?string $typeFilter = null,
        ?string $currency = null,
    ): Collection {
        $currency = $currency ?? (string) config('diyar.finance.currency', 'SAR');
        $window = $this->periods->resolve($period);
        $filter = app(VendorTransactionQueryFilter::class);

        $query = FinancialTransaction::query()
            ->with('order:id,order_number')
            ->where('currency', $currency)
            ->whereBetween('created_at', [$window['from'], $window['to']])
            ->latest();

        $filter->applyVendorScope($query, $vendorAccount);
        $filter->applyTypeFilter($query, $typeFilter);

        return $query->limit(5000)->get();
    }
}
