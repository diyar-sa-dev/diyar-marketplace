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
use App\Models\VendorOrder;
use App\Models\VendorPayout;
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
            pendingAffiliatePayouts: $summary->pendingAffiliatePayouts,
            completedOrders: $orderStats['completed'],
            averageOrderValue: $orderStats['average'],
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
     * @param  class-string<VendorPayout|AffiliatePayout>  $modelClass
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
