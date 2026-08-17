<?php

namespace App\Services\Finance;

use App\Enums\BalanceBucket;
use App\Enums\FinancialDirection;
use App\Enums\FinancialTransactionType;
use App\Models\FinancialTransaction;
use App\Models\VendorAccount;
use App\Services\Finance\DTO\VendorBalanceSummary;

final class VendorBalanceService
{
    public function summary(VendorAccount $vendorAccount, ?string $currency = null): VendorBalanceSummary
    {
        $currency = $currency ?? (string) config('diyar.finance.currency', 'SAR');

        $query = FinancialTransaction::query()
            ->where('vendor_account_id', $vendorAccount->id)
            ->where('currency', $currency);

        $escrowCredits = $this->sumBucket($query, BalanceBucket::VendorEscrow, FinancialDirection::Credit);
        $escrowDebits = $this->sumBucket($query, BalanceBucket::VendorEscrow, FinancialDirection::Debit);
        $availableCredits = $this->sumBucket($query, BalanceBucket::VendorAvailable, FinancialDirection::Credit);
        $availableDebits = $this->sumBucket($query, BalanceBucket::VendorAvailable, FinancialDirection::Debit);

        $pendingEscrow = bcsub($escrowCredits, $escrowDebits, 2);
        $availableBalance = bcsub($availableCredits, $availableDebits, 2);
        $paidOut = $this->sumType($query, FinancialTransactionType::Payout, FinancialDirection::Debit);
        $totalRevenue = $this->sumType($query, FinancialTransactionType::Escrow, FinancialDirection::Credit);

        if (bccomp($availableBalance, '0.00', 2) < 0) {
            $availableBalance = '0.00';
        }

        if (bccomp($pendingEscrow, '0.00', 2) < 0) {
            $pendingEscrow = '0.00';
        }

        return new VendorBalanceSummary(
            currency: $currency,
            totalRevenue: $totalRevenue,
            pendingEscrow: $pendingEscrow,
            availableBalance: $availableBalance,
            paidOut: $paidOut,
        );
    }

    public function availableBalance(VendorAccount $vendorAccount, ?string $currency = null): string
    {
        return $this->summary($vendorAccount, $currency)->availableBalance;
    }

    private function sumBucket($baseQuery, BalanceBucket $bucket, FinancialDirection $direction): string
    {
        $sum = (clone $baseQuery)
            ->where('balance_bucket', $bucket->value)
            ->where('direction', $direction->value)
            ->sum('amount');

        return number_format((float) $sum, 2, '.', '');
    }

    private function sumType($baseQuery, FinancialTransactionType $type, FinancialDirection $direction): string
    {
        $sum = (clone $baseQuery)
            ->where('transaction_type', $type->value)
            ->where('direction', $direction->value)
            ->sum('amount');

        return number_format((float) $sum, 2, '.', '');
    }
}
