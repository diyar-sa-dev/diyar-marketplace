<?php

namespace App\Services\Finance;

use App\Enums\FinancialTransactionType;
use App\Models\VendorAccount;
use Illuminate\Database\Eloquent\Builder;

final class VendorTransactionQueryFilter
{
    public function applyVendorScope(Builder $query, VendorAccount $vendorAccount): Builder
    {
        return $query->where(function (Builder $scoped) use ($vendorAccount) {
            $scoped->where('vendor_account_id', $vendorAccount->id)
                ->orWhere(function (Builder $commission) use ($vendorAccount) {
                    $commission->where('transaction_type', FinancialTransactionType::PlatformCommission->value)
                        ->whereHas('paymentVendorAllocation', fn (Builder $allocation) => $allocation
                            ->where('vendor_account_id', $vendorAccount->id));
                });
        });
    }

    public function applyTypeFilter(Builder $query, ?string $filter): Builder
    {
        $filter = strtolower(trim((string) $filter));

        if ($filter === '' || $filter === 'all') {
            return $query;
        }

        return match ($filter) {
            'revenue' => $query->where(function (Builder $revenue) {
                $revenue->whereIn('transaction_type', [
                    FinancialTransactionType::Escrow->value,
                    FinancialTransactionType::EscrowRelease->value,
                ])->where('direction', 'credit');
            }),
            'commission' => $query->where('transaction_type', FinancialTransactionType::PlatformCommission->value),
            'refund' => $query->where('transaction_type', FinancialTransactionType::Refund->value),
            'payout' => $query->where('transaction_type', FinancialTransactionType::Payout->value),
            'adjustment' => $query->where('transaction_type', FinancialTransactionType::Adjustment->value),
            default => $query,
        };
    }
}
