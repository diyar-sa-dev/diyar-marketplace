<?php

namespace App\Domains\Admin\Services;

use App\Domains\Affiliate\Services\AffiliateAdminPayoutService;
use App\Domains\Finance\Services\PayoutService;
use App\Domains\Notifications\Services\NotificationDispatcher;
use App\Domains\ServicesMarketplace\Services\ProviderPayoutService;
use App\Enums\NotificationType;
use App\Models\AffiliatePayout;
use App\Models\ProviderPayout;
use App\Models\User;
use App\Models\VendorPayout;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

final class AdminPayoutActionService
{
    public function __construct(
        private readonly PayoutService $vendorPayouts,
        private readonly AffiliateAdminPayoutService $affiliatePayouts,
        private readonly ProviderPayoutService $providerPayouts,
        private readonly AdminAuditService $audit,
        private readonly NotificationDispatcher $notifications,
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

            $this->notifyVendorUser($updated, 'تمت الموافقة على طلب السحب', "تمت الموافقة على طلب سحب الرصيد بقيمة {$updated->amount} {$updated->currency}.");

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

            $this->notifyVendorUser($updated, 'تم رفض طلب السحب', "تم رفض طلب سحب الرصيد بقيمة {$updated->amount} {$updated->currency}. السبب: {$reason}");

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

            $this->notifyVendorUser($updated, 'تم تحويل مبلغ السحب بنجاح', "تم تحويل مبلغ {$updated->amount} {$updated->currency} إلى حسابك البنكي بنجاح.");

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

    public function markAffiliatePayoutProcessing(AffiliatePayout $payout, User $actor): AffiliatePayout
    {
        return DB::transaction(function () use ($payout, $actor): AffiliatePayout {
            $before = ['status' => $payout->status->value];
            $updated = $this->affiliatePayouts->markProcessing($payout, $actor);

            $this->audit->record(
                actor: $actor,
                action: 'payout.affiliate.mark_processing',
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

    public function approveProviderPayout(ProviderPayout $payout, User $actor): ProviderPayout
    {
        return DB::transaction(function () use ($payout, $actor): ProviderPayout {
            $before = ['status' => $payout->status->value];
            $updated = $this->providerPayouts->approve($payout, $actor);

            $this->audit->record(
                actor: $actor,
                action: 'payout.provider.approve',
                resource: $updated,
                before: $before,
                after: ['status' => $updated->status->value],
            );

            $this->notifyProviderUser($updated, 'تمت الموافقة على طلب السحب', "تمت الموافقة على طلب سحب الرصيد بقيمة {$updated->amount} {$updated->currency}.");

            return $updated;
        });
    }

    public function rejectProviderPayout(ProviderPayout $payout, User $actor, string $reason): ProviderPayout
    {
        return DB::transaction(function () use ($payout, $actor, $reason): ProviderPayout {
            $before = ['status' => $payout->status->value];
            $updated = $this->providerPayouts->reject($payout, $actor, $reason);

            $this->audit->record(
                actor: $actor,
                action: 'payout.provider.reject',
                resource: $updated,
                before: $before,
                after: ['status' => $updated->status->value],
                reason: $reason,
            );

            $this->notifyProviderUser($updated, 'تم رفض طلب السحب', "تم رفض طلب سحب الرصيد بقيمة {$updated->amount} {$updated->currency}. السبب: {$reason}");

            return $updated;
        });
    }

    public function markProviderPayoutPaid(ProviderPayout $payout, User $actor): ProviderPayout
    {
        return DB::transaction(function () use ($payout, $actor): ProviderPayout {
            $before = ['status' => $payout->status->value];
            $updated = $this->providerPayouts->markPaid($payout, $actor);

            $this->audit->record(
                actor: $actor,
                action: 'payout.provider.mark_paid',
                resource: $updated,
                before: $before,
                after: ['status' => $updated->status->value],
            );

            $this->notifyProviderUser($updated, 'تم تحويل مبلغ السحب بنجاح', "تم تحويل مبلغ {$updated->amount} {$updated->currency} إلى حسابك البنكي بنجاح.");

            return $updated;
        });
    }

    private function notifyVendorUser(VendorPayout $payout, string $title, string $message): void
    {
        try {
            $user = $payout->vendorAccount?->user;
            if ($user === null) {
                return;
            }

            $frontendUrl = rtrim((string) config('diyar.frontend_url', 'http://localhost:3000'), '/');
            $this->notifications->dispatch(
                type: NotificationType::SystemAlert,
                recipients: [$user],
                payload: [
                    'title' => $title,
                    'message' => $message,
                    'action_url' => "{$frontendUrl}/dashboard/vendor/finance",
                    'reference' => $payout->reference,
                ],
                entityType: 'vendor_payout',
                entityId: $payout->id,
                dedupeKey: "payout.vendor.status:{$payout->id}:{$payout->status->value}",
            );
        } catch (\Throwable $e) {
            Log::warning('Failed sending payout notification to vendor', ['error' => $e->getMessage()]);
        }
    }

    private function notifyProviderUser(ProviderPayout $payout, string $title, string $message): void
    {
        try {
            $user = $payout->providerAccount?->user;
            if ($user === null) {
                return;
            }

            $frontendUrl = rtrim((string) config('diyar.frontend_url', 'http://localhost:3000'), '/');
            $this->notifications->dispatch(
                type: NotificationType::SystemAlert,
                recipients: [$user],
                payload: [
                    'title' => $title,
                    'message' => $message,
                    'action_url' => "{$frontendUrl}/dashboard/provider/finance",
                    'reference' => $payout->reference,
                ],
                entityType: 'provider_payout',
                entityId: $payout->id,
                dedupeKey: "payout.provider.status:{$payout->id}:{$payout->status->value}",
            );
        } catch (\Throwable $e) {
            Log::warning('Failed sending payout notification to provider', ['error' => $e->getMessage()]);
        }
    }
}
