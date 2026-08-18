<?php

namespace App\Services\Finance;

use App\Enums\PayoutStatus;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorBankAccount;
use App\Models\VendorPayout;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class PayoutService
{
    public function __construct(
        private readonly VendorBalanceService $balances,
        private readonly FinancialPostingService $posting,
        private readonly FinancialReferenceService $references,
    ) {}

    public function request(VendorAccount $vendorAccount, string $amount, string $currency): VendorPayout
    {
        $amount = number_format((float) $amount, 2, '.', '');
        $minimum = number_format((float) config('diyar.finance.payout_minimum', '100.00'), 2, '.', '');

        if (bccomp($amount, $minimum, 2) < 0) {
            throw new InvalidArgumentException(__('diyar.finance.payout_below_minimum', ['minimum' => $minimum]));
        }

        $hasBankAccount = VendorBankAccount::query()
            ->where('vendor_account_id', $vendorAccount->id)
            ->where('is_active', true)
            ->exists();

        if (! $hasBankAccount) {
            throw new InvalidArgumentException(__('diyar.finance.bank_account_required'));
        }

        return DB::transaction(function () use ($vendorAccount, $amount, $currency) {
            VendorAccount::query()->whereKey($vendorAccount->id)->lockForUpdate()->first();

            $available = $this->balances->availableBalance($vendorAccount, $currency);

            if (bccomp($amount, $available, 2) > 0) {
                throw new InvalidArgumentException(__('diyar.finance.insufficient_balance'));
            }

            $hasPending = VendorPayout::query()
                ->where('vendor_account_id', $vendorAccount->id)
                ->whereIn('status', [
                    PayoutStatus::Pending->value,
                    PayoutStatus::Approved->value,
                    PayoutStatus::Processing->value,
                ])
                ->exists();

            if ($hasPending) {
                throw new InvalidArgumentException(__('diyar.finance.pending_payout_exists'));
            }

            return VendorPayout::query()->create([
                'reference' => $this->references->nextPayoutReference(),
                'vendor_account_id' => $vendorAccount->id,
                'amount' => $amount,
                'currency' => $currency,
                'status' => PayoutStatus::Pending,
                'requested_at' => now(),
            ]);
        });
    }

    public function approve(VendorPayout $payout, User $admin): VendorPayout
    {
        if ($payout->status !== PayoutStatus::Pending) {
            throw new InvalidArgumentException(__('diyar.finance.invalid_payout_transition'));
        }

        $payout->update([
            'status' => PayoutStatus::Approved,
            'processed_by' => $admin->id,
        ]);

        return $payout->fresh();
    }

    public function reject(VendorPayout $payout, User $admin, string $reason): VendorPayout
    {
        if (! in_array($payout->status, [PayoutStatus::Pending, PayoutStatus::Approved], true)) {
            throw new InvalidArgumentException(__('diyar.finance.invalid_payout_transition'));
        }

        $payout->update([
            'status' => PayoutStatus::Rejected,
            'processed_by' => $admin->id,
            'processed_at' => now(),
            'rejection_reason' => $reason,
        ]);

        return $payout->fresh();
    }

    public function markPaid(VendorPayout $payout, User $admin): VendorPayout
    {
        if ($payout->status === PayoutStatus::Paid) {
            return $payout;
        }

        if (! in_array($payout->status, [PayoutStatus::Approved, PayoutStatus::Processing], true)) {
            throw new InvalidArgumentException(__('diyar.finance.invalid_payout_transition'));
        }

        return DB::transaction(function () use ($payout, $admin) {
            $payout = VendorPayout::query()->whereKey($payout->id)->lockForUpdate()->firstOrFail();
            $vendorAccount = VendorAccount::query()->whereKey($payout->vendor_account_id)->lockForUpdate()->firstOrFail();

            $available = $this->balances->availableBalance($vendorAccount, $payout->currency);
            $amount = number_format((float) $payout->amount, 2, '.', '');

            if (bccomp($amount, $available, 2) > 0) {
                throw new InvalidArgumentException(__('diyar.finance.insufficient_balance'));
            }

            $this->posting->postPayoutDebit($payout);

            $payout->update([
                'status' => PayoutStatus::Paid,
                'processed_by' => $admin->id,
                'processed_at' => now(),
            ]);

            return $payout->fresh();
        });
    }

    public function cancel(VendorPayout $payout): VendorPayout
    {
        if ($payout->status !== PayoutStatus::Pending) {
            throw new InvalidArgumentException(__('diyar.finance.invalid_payout_transition'));
        }

        $payout->update(['status' => PayoutStatus::Cancelled]);

        return $payout->fresh();
    }
}
