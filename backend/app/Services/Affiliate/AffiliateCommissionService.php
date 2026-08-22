<?php

namespace App\Services\Affiliate;

use App\Enums\AffiliateCommissionStatus;
use App\Events\Domain\AffiliateCommissionAvailable;
use App\Models\AffiliateClick;
use App\Models\AffiliateCommission;
use App\Models\AffiliateProfile;
use App\Models\OrderItem;
use App\Models\ReturnRequest;
use App\Models\VendorOrder;
use App\Services\Finance\FinancialPostingService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

final class AffiliateCommissionService
{
    public function __construct(
        private readonly FinancialPostingService $financialPosting,
    ) {}

    public function createPendingFromOrderItem(OrderItem $orderItem): ?AffiliateCommission
    {
        if ($orderItem->affiliate_profile_id === null) {
            return null;
        }

        $orderItem->loadMissing('vendorOrder');

        $idempotencyKey = "affiliate:commission:order_item:{$orderItem->id}";

        $existing = AffiliateCommission::query()
            ->where('idempotency_key', $idempotencyKey)
            ->first();

        if ($existing !== null) {
            $this->financialPosting->postAffiliateCommissionPending($existing);

            return $existing;
        }

        $baseAmount = number_format((float) ($orderItem->affiliate_commission_base ?? $orderItem->line_subtotal), 2, '.', '');
        $rate = number_format((float) ($orderItem->affiliate_commission_rate ?? 0), 2, '.', '');
        $commissionAmount = $this->calculateCommissionAmount($baseAmount, $rate);
        $currency = (string) config('diyar.affiliate.currency', 'SAR');

        try {
            $commission = AffiliateCommission::query()->create([
                'affiliate_profile_id' => $orderItem->affiliate_profile_id,
                'affiliate_link_id' => $orderItem->affiliate_link_id,
                'affiliate_click_id' => $orderItem->affiliate_click_id,
                'traffic_source' => $orderItem->affiliate_traffic_source,
                'order_id' => $orderItem->vendorOrder?->order_id,
                'order_item_id' => $orderItem->id,
                'vendor_order_id' => $orderItem->vendor_order_id,
                'product_id' => $orderItem->product_id,
                'status' => AffiliateCommissionStatus::Pending,
                'commission_rate_percent' => $rate,
                'commission_base_amount' => $baseAmount,
                'commission_amount' => $commissionAmount,
                'currency' => $currency,
                'idempotency_key' => $idempotencyKey,
            ]);
        } catch (QueryException $exception) {
            if (! $this->isIdempotencyViolation($exception)) {
                throw $exception;
            }

            return AffiliateCommission::query()
                ->where('idempotency_key', $idempotencyKey)
                ->first()
                ?->tap(fn (AffiliateCommission $commission) => $this->financialPosting->postAffiliateCommissionPending($commission));
        }

        $this->financialPosting->postAffiliateCommissionPending($commission);

        return $commission;
    }

    public function markAvailableForVendorOrder(VendorOrder $vendorOrder): int
    {
        $updated = 0;

        $commissions = AffiliateCommission::query()
            ->where('vendor_order_id', $vendorOrder->id)
            ->where('status', AffiliateCommissionStatus::Pending)
            ->get();

        foreach ($commissions as $commission) {
            $commission->update([
                'status' => AffiliateCommissionStatus::Available,
                'available_at' => now(),
            ]);

            $this->financialPosting->postAffiliateCommissionAvailable($commission->fresh());

            $commission->loadMissing('profile');

            DB::afterCommit(fn () => event(new AffiliateCommissionAvailable($commission->fresh(['profile.user']))));

            if ($commission->profile !== null) {
                AffiliateDashboardService::bustDashboardCache($commission->profile);
            }

            $updated++;
        }

        return $updated;
    }

    public function reverseForReturn(ReturnRequest $returnRequest): int
    {
        $returnRequest->loadMissing('items.orderItem');

        $reversed = 0;

        foreach ($returnRequest->items as $returnItem) {
            $orderItemId = $returnItem->order_item_id;

            $commissions = AffiliateCommission::query()
                ->where('order_item_id', $orderItemId)
                ->whereIn('status', [
                    AffiliateCommissionStatus::Pending->value,
                    AffiliateCommissionStatus::Available->value,
                    AffiliateCommissionStatus::Approved->value,
                ])
                ->get();

            foreach ($commissions as $commission) {
                $previousStatus = $commission->status;

                $commission->update([
                    'status' => AffiliateCommissionStatus::Reversed,
                    'reversed_at' => now(),
                ]);

                $this->financialPosting->postAffiliateCommissionReversal($commission->fresh(), $previousStatus);

                $reversed++;
            }
        }

        if ($reversed > 0 && $returnRequest->items->isNotEmpty()) {
            $firstItem = $returnRequest->items->first()?->orderItem;
            $profileId = $firstItem?->affiliate_profile_id;

            if ($profileId !== null) {
                $profile = AffiliateProfile::query()->find($profileId);

                if ($profile !== null) {
                    AffiliateDashboardService::bustDashboardCache($profile);
                }
            }
        }

        return $reversed;
    }

    private function calculateCommissionAmount(string $baseAmount, string $rate): string
    {
        $amount = bcmul($baseAmount, bcdiv($rate, '100', 6), 4);

        return number_format((float) $amount, 2, '.', '');
    }

    private function isIdempotencyViolation(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'unique') && str_contains($message, 'idempotency');
    }
}
