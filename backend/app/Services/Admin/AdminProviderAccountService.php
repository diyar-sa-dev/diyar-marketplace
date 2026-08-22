<?php

namespace App\Services\Admin;

use App\Enums\ProviderAccountStatus;
use App\Models\ProviderAccount;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class AdminProviderAccountService
{
    public function __construct(
        private readonly AdminAuditService $audit,
    ) {}

    public function suspend(ProviderAccount $account, User $actor, ?string $reason = null): ProviderAccount
    {
        if ($account->status === ProviderAccountStatus::Suspended) {
            return $account;
        }

        return DB::transaction(function () use ($account, $actor, $reason): ProviderAccount {
            $before = ['status' => $account->status->value];
            $account->status = ProviderAccountStatus::Suspended;
            $account->save();

            $this->audit->record(
                actor: $actor,
                action: 'provider.suspend',
                resource: $account,
                before: $before,
                after: ['status' => $account->status->value],
                reason: $reason,
            );

            return $account->fresh(['user']);
        });
    }

    public function activate(ProviderAccount $account, User $actor, ?string $reason = null): ProviderAccount
    {
        if ($account->status === ProviderAccountStatus::Active) {
            return $account;
        }

        return DB::transaction(function () use ($account, $actor, $reason): ProviderAccount {
            $before = ['status' => $account->status->value];
            $account->status = ProviderAccountStatus::Active;
            $account->save();

            $this->audit->record(
                actor: $actor,
                action: 'provider.activate',
                resource: $account,
                before: $before,
                after: ['status' => $account->status->value],
                reason: $reason,
            );

            return $account->fresh(['user']);
        });
    }
}
