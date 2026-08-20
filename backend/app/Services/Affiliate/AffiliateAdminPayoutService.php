<?php

namespace App\Services\Affiliate;

use App\Enums\AffiliateCommissionStatus;
use App\Enums\AffiliatePayoutStatus;
use App\Models\AffiliateCommission;
use App\Models\AffiliatePayout;
use App\Models\AffiliateProfile;
use App\Models\User;
use App\Services\Finance\FinancialPostingService;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class AffiliateAdminPayoutService
{
    public function __construct(
        private readonly FinancialPostingService $posting,
    ) {}

    public function approve(AffiliatePayout $payout, User $admin): AffiliatePayout
    {
        if ($payout->status !== AffiliatePayoutStatus::Pending) {
            throw new InvalidArgumentException(__('diyar.affiliate.invalid_payout_transition'));
        }

        $payout->update([
            'status' => AffiliatePayoutStatus::Approved,
            'processed_by' => $admin->id,
        ]);

        return $payout->fresh(['profile.user']);
    }

    public function markProcessing(AffiliatePayout $payout, User $admin): AffiliatePayout
    {
        if ($payout->status !== AffiliatePayoutStatus::Approved) {
            throw new InvalidArgumentException(__('diyar.affiliate.invalid_payout_transition'));
        }

        $payout->update([
            'status' => AffiliatePayoutStatus::Processing,
            'processed_by' => $admin->id,
        ]);

        return $payout->fresh(['profile.user']);
    }

    public function reject(AffiliatePayout $payout, User $admin, string $reason): AffiliatePayout
    {
        if (! in_array($payout->status, [AffiliatePayoutStatus::Pending, AffiliatePayoutStatus::Approved, AffiliatePayoutStatus::Processing], true)) {
            throw new InvalidArgumentException(__('diyar.affiliate.invalid_payout_transition'));
        }

        return DB::transaction(function () use ($payout, $admin, $reason) {
            $payout = AffiliatePayout::query()->whereKey($payout->id)->lockForUpdate()->firstOrFail();

            AffiliateCommission::query()
                ->where('affiliate_payout_id', $payout->id)
                ->where('status', AffiliateCommissionStatus::Approved)
                ->update([
                    'status' => AffiliateCommissionStatus::Available,
                    'affiliate_payout_id' => null,
                ]);

            $payout->update([
                'status' => AffiliatePayoutStatus::Rejected,
                'processed_by' => $admin->id,
                'processed_at' => now(),
                'rejection_reason' => $reason,
            ]);

            if ($payout->profile !== null) {
                AffiliateDashboardService::bustDashboardCache($payout->profile);
            } else {
                $profile = AffiliateProfile::query()->find($payout->affiliate_profile_id);

                if ($profile !== null) {
                    AffiliateDashboardService::bustDashboardCache($profile);
                }
            }

            return $payout->fresh(['profile.user']);
        });
    }

    public function markPaid(AffiliatePayout $payout, User $admin, ?string $paymentReference = null): AffiliatePayout
    {
        if ($payout->status === AffiliatePayoutStatus::Paid) {
            return $payout;
        }

        if (! in_array($payout->status, [AffiliatePayoutStatus::Approved, AffiliatePayoutStatus::Processing], true)) {
            throw new InvalidArgumentException(__('diyar.affiliate.invalid_payout_transition'));
        }

        return DB::transaction(function () use ($payout, $admin, $paymentReference) {
            $payout = AffiliatePayout::query()->whereKey($payout->id)->lockForUpdate()->firstOrFail();

            AffiliateCommission::query()
                ->where('affiliate_payout_id', $payout->id)
                ->where('status', AffiliateCommissionStatus::Approved)
                ->update(['status' => AffiliateCommissionStatus::Paid]);

            $this->posting->postAffiliatePayoutDebit($payout);

            $payout->update([
                'status' => AffiliatePayoutStatus::Paid,
                'processed_by' => $admin->id,
                'processed_at' => now(),
                'payment_reference' => $paymentReference,
            ]);

            if ($payout->profile !== null) {
                AffiliateDashboardService::bustDashboardCache($payout->profile);
            }

            return $payout->fresh(['profile.user']);
        });
    }
}
