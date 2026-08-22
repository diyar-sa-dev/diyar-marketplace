<?php

namespace App\Services\Admin;

use App\Enums\VendorAccountStatus;
use App\Models\User;
use App\Models\VendorAccount;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class AdminVendorAccountService
{
    public function __construct(
        private readonly AdminAuditService $audit,
    ) {}

    public function suspend(VendorAccount $account, User $actor, ?string $reason = null): VendorAccount
    {
        if ($account->status === VendorAccountStatus::Suspended) {
            return $account;
        }

        return DB::transaction(function () use ($account, $actor, $reason): VendorAccount {
            $before = ['status' => $account->status->value];
            $account->status = VendorAccountStatus::Suspended;
            $account->save();

            $this->audit->record(
                actor: $actor,
                action: 'vendor.suspend',
                resource: $account,
                before: $before,
                after: ['status' => $account->status->value],
                reason: $reason,
            );

            return $account->fresh(['user']);
        });
    }

    public function activate(VendorAccount $account, User $actor, ?string $reason = null): VendorAccount
    {
        if ($account->status === VendorAccountStatus::Active) {
            return $account;
        }

        if ($account->status === VendorAccountStatus::Pending) {
            throw new InvalidArgumentException(__('admin.errors.vendor_pending_not_supported'));
        }

        return DB::transaction(function () use ($account, $actor, $reason): VendorAccount {
            $before = ['status' => $account->status->value];
            $account->status = VendorAccountStatus::Active;
            $account->save();

            $this->audit->record(
                actor: $actor,
                action: 'vendor.activate',
                resource: $account,
                before: $before,
                after: ['status' => $account->status->value],
                reason: $reason,
            );

            return $account->fresh(['user']);
        });
    }
}
