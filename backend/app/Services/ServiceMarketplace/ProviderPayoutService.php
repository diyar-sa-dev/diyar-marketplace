<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\PayoutStatus;
use App\Models\ProviderAccount;
use App\Models\ProviderBankAccount;
use App\Models\ProviderPayout;
use App\Models\User;
use App\Services\Finance\FinancialReferenceService;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class ProviderPayoutService
{
    public function __construct(
        private readonly ProviderFinanceService $finance,
        private readonly FinancialReferenceService $references,
    ) {}

    public function request(
        ProviderAccount $provider,
        string $amount,
        string $currency,
        ?string $bankAccountId = null,
    ): ProviderPayout {
        $amount = number_format((float) $amount, 2, '.', '');
        $minimum = number_format((float) config('diyar.finance.payout_minimum', '100.00'), 2, '.', '');

        if (bccomp($amount, $minimum, 2) < 0) {
            throw new InvalidArgumentException(__('diyar.finance.payout_below_minimum', ['minimum' => $minimum]));
        }

        $bankAccount = $this->resolveBankAccount($provider, $bankAccountId);

        return DB::transaction(function () use ($provider, $amount, $currency, $bankAccount) {
            ProviderAccount::query()->whereKey($provider->id)->lockForUpdate()->first();

            $summary = $this->finance->summary($provider);
            $available = number_format((float) $summary['available_balance'], 2, '.', '');

            if (bccomp($amount, $available, 2) > 0) {
                throw new InvalidArgumentException(__('diyar.finance.insufficient_balance'));
            }

            $hasPending = ProviderPayout::query()
                ->where('provider_account_id', $provider->id)
                ->whereIn('status', [
                    PayoutStatus::Pending->value,
                    PayoutStatus::Approved->value,
                    PayoutStatus::Processing->value,
                ])
                ->exists();

            if ($hasPending) {
                throw new InvalidArgumentException(__('diyar.finance.pending_payout_exists'));
            }

            return ProviderPayout::query()->create([
                'reference' => $this->references->nextPayoutReference(),
                'provider_account_id' => $provider->id,
                'provider_bank_account_id' => $bankAccount->id,
                'amount' => $amount,
                'currency' => $currency,
                'status' => PayoutStatus::Pending,
                'requested_at' => now(),
            ]);
        });
    }

    public function approve(ProviderPayout $payout, User $admin): ProviderPayout
    {
        if ($payout->status !== PayoutStatus::Pending) {
            throw new InvalidArgumentException(__('diyar.finance.invalid_payout_transition'));
        }

        $payout->update([
            'status' => PayoutStatus::Approved,
            'processed_by' => $admin->id,
        ]);

        return $payout->fresh(['providerAccount.user', 'bankAccount']) ?? $payout;
    }

    public function reject(ProviderPayout $payout, User $admin, string $reason): ProviderPayout
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

        return $payout->fresh(['providerAccount.user', 'bankAccount']) ?? $payout;
    }

    public function markPaid(ProviderPayout $payout, User $admin): ProviderPayout
    {
        if ($payout->status === PayoutStatus::Paid) {
            return $payout;
        }

        if (! in_array($payout->status, [PayoutStatus::Approved, PayoutStatus::Processing], true)) {
            throw new InvalidArgumentException(__('diyar.finance.invalid_payout_transition'));
        }

        $payout->update([
            'status' => PayoutStatus::Paid,
            'processed_by' => $admin->id,
            'processed_at' => now(),
        ]);

        return $payout->fresh(['providerAccount.user', 'bankAccount']) ?? $payout;
    }

    private function resolveBankAccount(ProviderAccount $provider, ?string $bankAccountId): ProviderBankAccount
    {
        if ($bankAccountId !== null) {
            $account = ProviderBankAccount::query()
                ->where('provider_account_id', $provider->id)
                ->whereKey($bankAccountId)
                ->where('is_active', true)
                ->first();

            if ($account === null) {
                throw new InvalidArgumentException(__('diyar.finance.bank_account_required'));
            }

            return $account;
        }

        $account = ProviderBankAccount::query()
            ->where('provider_account_id', $provider->id)
            ->where('is_active', true)
            ->latest()
            ->first();

        if ($account === null) {
            throw new InvalidArgumentException(__('diyar.finance.bank_account_required'));
        }

        return $account;
    }
}
