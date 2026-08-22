<?php

namespace App\Services\Admin;

use App\Models\AffiliatePayout;
use App\Models\User;
use App\Models\VendorPayout;
use App\Services\Affiliate\AffiliateAdminPayoutService;
use App\Services\Finance\PayoutService;
use Illuminate\Support\Facades\DB;

final class AdminPayoutActionService
{
    public function __construct(
        private readonly PayoutService $vendorPayouts,
        private readonly AffiliateAdminPayoutService $affiliatePayouts,
        private readonly AdminAuditService $audit,
    ) {}

    public function approveVendorPayout(VendorPayout $payout, User $actor): VendorPayout
    {
        return DB::transaction(function () use ($payout, $actor): VendorPayout {
            $before = ['status' => $payout->status->value];
            $updated = $this->vendorPayouts->approve($payout, $actor);

            $this->audit->record(
                actor: $actor,
                action: 'payout.vendor.approve',
                resource: $updated,
                before: $before,
                after: ['status' => $updated->status->value],
            );

            return $updated;
        });
    }

    public function rejectVendorPayout(VendorPayout $payout, User $actor, string $reason): VendorPayout
    {
        return DB::transaction(function () use ($payout, $actor, $reason): VendorPayout {
            $before = ['status' => $payout->status->value];
            $updated = $this->vendorPayouts->reject($payout, $actor, $reason);

            $this->audit->record(
                actor: $actor,
                action: 'payout.vendor.reject',
                resource: $updated,
                before: $before,
                after: ['status' => $updated->status->value],
                reason: $reason,
            );

            return $updated;
        });
    }

    public function markVendorPayoutPaid(VendorPayout $payout, User $actor): VendorPayout
    {
        return DB::transaction(function () use ($payout, $actor): VendorPayout {
            $before = ['status' => $payout->status->value];
            $updated = $this->vendorPayouts->markPaid($payout, $actor);

            $this->audit->record(
                actor: $actor,
                action: 'payout.vendor.mark_paid',
                resource: $updated,
                before: $before,
                after: ['status' => $updated->status->value],
            );

            return $updated;
        });
    }

    public function approveAffiliatePayout(AffiliatePayout $payout, User $actor): AffiliatePayout
    {
        return DB::transaction(function () use ($payout, $actor): AffiliatePayout {
            $before = ['status' => $payout->status->value];
            $updated = $this->affiliatePayouts->approve($payout, $actor);

            $this->audit->record(
                actor: $actor,
                action: 'payout.affiliate.approve',
                resource: $updated,
                before: $before,
                after: ['status' => $updated->status->value],
            );

            return $updated;
        });
    }

    public function rejectAffiliatePayout(AffiliatePayout $payout, User $actor, string $reason): AffiliatePayout
    {
        return DB::transaction(function () use ($payout, $actor, $reason): AffiliatePayout {
            $before = ['status' => $payout->status->value];
            $updated = $this->affiliatePayouts->reject($payout, $actor, $reason);

            $this->audit->record(
                actor: $actor,
                action: 'payout.affiliate.reject',
                resource: $updated,
                before: $before,
                after: ['status' => $updated->status->value],
                reason: $reason,
            );

            return $updated;
        });
    }

    public function markAffiliatePayoutPaid(AffiliatePayout $payout, User $actor, ?string $paymentReference = null): AffiliatePayout
    {
        return DB::transaction(function () use ($payout, $actor, $paymentReference): AffiliatePayout {
            $before = ['status' => $payout->status->value];
            $updated = $this->affiliatePayouts->markPaid($payout, $actor, $paymentReference);

            $this->audit->record(
                actor: $actor,
                action: 'payout.affiliate.mark_paid',
                resource: $updated,
                before: $before,
                after: ['status' => $updated->status->value],
            );

            return $updated;
        });
    }
}
