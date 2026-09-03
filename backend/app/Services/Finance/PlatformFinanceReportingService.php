<?php

namespace App\Services\Finance;

use App\Enums\AffiliateCommissionStatus;
use App\Enums\BalanceBucket;
use App\Enums\FinancePeriod;
use App\Enums\FinancialDirection;
use App\Enums\FinancialTransactionType;
use App\Enums\PaymentStatus;
use App\Enums\PayoutStatus;
use App\Enums\VendorOrderStatus;
use App\Models\AffiliateCommission;
use App\Models\AffiliatePayout;
use App\Models\FinancialTransaction;
use App\Models\PaymentVendorAllocation;
use App\Models\ProviderPayout;
use App\Models\VendorOrder;
use App\Models\VendorPayout;
use App\Services\Analytics\AnalyticsTimeBuckets;
use App\Services\Finance\DTO\PlatformFinancePeriodReport;
use App\Services\Finance\DTO\PlatformFinanceSummary;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

final class PlatformFinanceReportingService
{
    public function __construct(
        private readonly VendorFinancePeriodResolver $periods,
    ) {}

    public function summary(?string $currency = null): PlatformFinanceSummary
    {
        $currency = $currency ?? (string) config('diyar.finance.currency', 'SAR');

        return new PlatformFinanceSummary(
            currency: $currency,
            platformEarnings: $this->platformEarningsTotal($currency),
            pendingEscrow: $this->totalPendingEscrow($currency),
            pendingVendorPayouts: $this->pendingPayoutTotal(VendorPayout::class, $currency),
            pendingAffiliatePayouts: $this->pendingPayoutTotal(AffiliatePayout::class, $currency),
        );
    }

    public function periodReport(FinancePeriod $period, ?string $currency = null): PlatformFinancePeriodReport
    {
        $currency = $currency ?? (string) config('diyar.finance.currency', 'SAR');
        $window = $this->periods->resolve($period);
        $from = $window['from'];
        $to = $window['to'];

        $allocation = $this->allocationStatsForWindow($currency, $from, $to);
        $affiliateCommission = $this->affiliateCommissionForWindow($currency, $from, $to);
        $refunds = $this->platformCommissionRefundsForWindow($currency, $from, $to);

        $netEarnings = bcsub(bcsub($allocation['commission'], $affiliateCommission, 2), $refunds, 2);
        if (bccomp($netEarnings, '0.00', 2) < 0) {
            $netEarnings = '0.00';
        }

        $orderStats = $this->orderStatsForWindow($from, $to);
        $summary = $this->summary($currency);
        $granularity = $period->analyticsGranularity();

        return new PlatformFinancePeriodReport(
            periodType: $period,
            from: $from,
            to: $to,
            currency: $currency,
            grossSales: $allocation['gross'],
            platformCommission: $allocation['commission'],
            affiliateCommission: $affiliateCommission,
            refunds: $refunds,
            netEarnings: $netEarnings,
            platformEarnings: $summary->platformEarnings,
            pendingEscrow: $summary->pendingEscrow,
            pendingVendorPayouts: $summary->pendingVendorPayouts,
            pendingProviderPayouts: $this->pendingPayoutTotal(ProviderPayout::class, $currency),
            pendingAffiliatePayouts: $summary->pendingAffiliatePayouts,
            completedOrders: $orderStats['completed'],
            averageOrderValue: $orderStats['average'],
            granularity: $granularity,
            series: $this->chartSeriesForWindow($currency, $from, $to, $granularity),
        );
    }

    /**
     * @return Collection<int, FinancialTransaction>
     */
    public function transactionsForExport(FinancePeriod $period, ?string $currency = null)
    {
        $currency = $currency ?? (string) config('diyar.finance.currency', 'SAR');
        $window = $this->periods->resolve($period);

        return FinancialTransaction::query()
            ->with('order:id,order_number')
            ->whereNull('vendor_account_id')
            ->where('currency', $currency)
            ->where('transaction_type', '!=', FinancialTransactionType::Payout->value)
            ->whereBetween('created_at', [$window['from'], $window['to']])
            ->latest()
            ->limit(5000)
            ->get();
    }

    private function platformEarningsTotal(string $currency): string
    {
        $credits = $this->sumPlatformBucket($currency, BalanceBucket::PlatformCommission, FinancialDirection::Credit);
        $debits = $this->sumPlatformBucket($currency, BalanceBucket::PlatformCommission, FinancialDirection::Debit);

        return $this->nonNegative(bcsub($credits, $debits, 2));
    }

    private function totalPendingEscrow(string $currency): string
    {
        $credits = FinancialTransaction::query()
            ->where('currency', $currency)
            ->where('balance_bucket', BalanceBucket::VendorEscrow->value)
            ->where('direction', FinancialDirection::Credit->value)
            ->sum('amount');
        $debits = FinancialTransaction::query()
            ->where('currency', $currency)
            ->where('balance_bucket', BalanceBucket::VendorEscrow->value)
            ->where('direction', FinancialDirection::Debit->value)
            ->sum('amount');

        return $this->nonNegative(bcsub(
            number_format((float) $credits, 2, '.', ''),
            number_format((float) $debits, 2, '.', ''),
            2,
        ));
    }

    /**
     * @param  class-string<VendorPayout|AffiliatePayout|ProviderPayout>  $modelClass
     */
    private function pendingPayoutTotal(string $modelClass, string $currency): string
    {
        $sum = $modelClass::query()
            ->where('currency', $currency)
            ->whereIn('status', [
                PayoutStatus::Pending->value,
                PayoutStatus::Approved->value,
                PayoutStatus::Processing->value,
            ])
            ->sum('amount');

        return number_format((float) $sum, 2, '.', '');
    }

    /**
     * @return array{gross: string, commission: string}
     */
    private function allocationStatsForWindow(string $currency, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $row = PaymentVendorAllocation::query()
            ->selectRaw('COALESCE(SUM(vendor_gross_total), 0) as gross_total')
            ->selectRaw('COALESCE(SUM(platform_commission_amount), 0) as commission_total')
            ->where('currency', $currency)
            ->whereHas('payment', function ($query) use ($from, $to) {
                $query->where('status', PaymentStatus::Paid->value)
                    ->whereNotNull('paid_at')
                    ->whereBetween('paid_at', [$from, $to]);
            })
            ->first();

        return [
            'gross' => number_format((float) ($row->gross_total ?? 0), 2, '.', ''),
            'commission' => number_format((float) ($row->commission_total ?? 0), 2, '.', ''),
        ];
    }

    private function affiliateCommissionForWindow(string $currency, CarbonImmutable $from, CarbonImmutable $to): string
    {
        $sum = AffiliateCommission::query()
            ->where('currency', $currency)
            ->whereNotIn('status', [
                AffiliateCommissionStatus::Cancelled->value,
                AffiliateCommissionStatus::Reversed->value,
            ])
            ->whereBetween('created_at', [$from, $to])
            ->sum('commission_amount');

        return number_format((float) $sum, 2, '.', '');
    }

    private function platformCommissionRefundsForWindow(string $currency, CarbonImmutable $from, CarbonImmutable $to): string
    {
        $sum = FinancialTransaction::query()
            ->whereNull('vendor_account_id')
            ->where('currency', $currency)
            ->where('transaction_type', FinancialTransactionType::Refund->value)
            ->where('balance_bucket', BalanceBucket::PlatformCommission->value)
            ->where('direction', FinancialDirection::Debit->value)
            ->whereBetween('created_at', [$from, $to])
            ->sum('amount');

        return number_format((float) $sum, 2, '.', '');
    }

    /**
     * @return array{completed: int, average: string}
     */
    private function orderStatsForWindow(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $query = VendorOrder::query()
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
     * @return list<array{label: string, gross_sales: string, platform_commission: string, affiliate_commission: string, net_earnings: string}>
     */
    private function chartSeriesForWindow(
        string $currency,
        CarbonImmutable $from,
        CarbonImmutable $to,
        string $granularity,
    ): array {
        $buckets = AnalyticsTimeBuckets::build($from, $to, $granularity);
        $gross = $this->zeroedBucketMap($buckets);
        $commission = $this->zeroedBucketMap($buckets);
        $affiliate = $this->zeroedBucketMap($buckets);
        $refunds = $this->zeroedBucketMap($buckets);

        $allocations = PaymentVendorAllocation::query()
            ->join('payments', 'payments.id', '=', 'payment_vendor_allocations.payment_id')
            ->where('payment_vendor_allocations.currency', $currency)
            ->where('payments.status', PaymentStatus::Paid->value)
            ->whereNotNull('payments.paid_at')
            ->whereBetween('payments.paid_at', [$from, $to])
            ->selectRaw(
                'payments.paid_at as paid_at, payment_vendor_allocations.vendor_gross_total as vendor_gross_total, payment_vendor_allocations.platform_commission_amount as platform_commission_amount',
            )
            ->get();

        foreach ($allocations as $row) {
            $label = $this->bucketLabelFor($buckets, CarbonImmutable::parse((string) $row->paid_at));
            if ($label === null) {
                continue;
            }
            $gross[$label] = bcadd($gross[$label], number_format((float) $row->vendor_gross_total, 2, '.', ''), 2);
            $commission[$label] = bcadd(
                $commission[$label],
                number_format((float) $row->platform_commission_amount, 2, '.', ''),
                2,
            );
        }

        $commissionRows = AffiliateCommission::query()
            ->where('currency', $currency)
            ->whereNotIn('status', [
                AffiliateCommissionStatus::Cancelled->value,
                AffiliateCommissionStatus::Reversed->value,
            ])
            ->whereBetween('created_at', [$from, $to])
            ->get(['created_at', 'commission_amount']);

        foreach ($commissionRows as $row) {
            $label = $this->bucketLabelFor($buckets, CarbonImmutable::parse((string) $row->created_at));
            if ($label === null) {
                continue;
            }
            $affiliate[$label] = bcadd(
                $affiliate[$label],
                number_format((float) $row->commission_amount, 2, '.', ''),
                2,
            );
        }

        $refundRows = FinancialTransaction::query()
            ->whereNull('vendor_account_id')
            ->where('currency', $currency)
            ->where('transaction_type', FinancialTransactionType::Refund->value)
            ->where('balance_bucket', BalanceBucket::PlatformCommission->value)
            ->where('direction', FinancialDirection::Debit->value)
            ->whereBetween('created_at', [$from, $to])
            ->get(['created_at', 'amount']);

        foreach ($refundRows as $row) {
            $label = $this->bucketLabelFor($buckets, CarbonImmutable::parse((string) $row->created_at));
            if ($label === null) {
                continue;
            }
            $refunds[$label] = bcadd($refunds[$label], number_format((float) $row->amount, 2, '.', ''), 2);
        }

        $series = [];
        foreach ($buckets as $bucket) {
            $label = $bucket['label'];
            $net = bcsub(bcsub($commission[$label], $affiliate[$label], 2), $refunds[$label], 2);
            if (bccomp($net, '0.00', 2) < 0) {
                $net = '0.00';
            }

            $series[] = [
                'label' => $label,
                'gross_sales' => $gross[$label],
                'platform_commission' => $commission[$label],
                'affiliate_commission' => $affiliate[$label],
                'net_earnings' => $net,
            ];
        }

        return $series;
    }

    /**
     * @param  list<array{label: string, from: CarbonImmutable, to: CarbonImmutable}>  $buckets
     * @return array<string, string>
     */
    private function zeroedBucketMap(array $buckets): array
    {
        $map = [];
        foreach ($buckets as $bucket) {
            $map[$bucket['label']] = '0.00';
        }

        return $map;
    }

    /**
     * @param  list<array{label: string, from: CarbonImmutable, to: CarbonImmutable}>  $buckets
     */
    private function bucketLabelFor(array $buckets, CarbonImmutable $at): ?string
    {
        foreach ($buckets as $bucket) {
            if ($at->greaterThanOrEqualTo($bucket['from']) && $at->lessThanOrEqualTo($bucket['to'])) {
                return $bucket['label'];
            }
        }

        return null;
    }

    private function sumPlatformBucket(string $currency, BalanceBucket $bucket, FinancialDirection $direction): string
    {
        $sum = FinancialTransaction::query()
            ->whereNull('vendor_account_id')
            ->where('currency', $currency)
            ->where('balance_bucket', $bucket->value)
            ->where('direction', $direction->value)
            ->sum('amount');

        return number_format((float) $sum, 2, '.', '');
    }

    private function nonNegative(string $amount): string
    {
        if (bccomp($amount, '0.00', 2) < 0) {
            return '0.00';
        }

        return $amount;
    }
}
