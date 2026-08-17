<?php

namespace App\Services\Returns;

use App\Enums\ReturnShippingPaidBy;
use App\Models\User;
use App\Models\VendorReturnPolicy;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final class VendorReturnPolicyService
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function upsert(User $user, array $attributes): VendorReturnPolicy
    {
        $vendorAccount = $user->vendorAccount;

        if ($vendorAccount === null) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        return DB::transaction(function () use ($vendorAccount, $attributes) {
            $policy = VendorReturnPolicy::query()
                ->where('vendor_account_id', $vendorAccount->id)
                ->lockForUpdate()
                ->first();

            $payload = [
                'returnable' => (bool) ($attributes['returnable'] ?? true),
                'return_window_days' => (int) ($attributes['return_window_days'] ?? 7),
                'accepted_reasons' => array_values(array_unique(array_map('strval', $attributes['accepted_reasons'] ?? []))),
                'requires_unused' => (bool) ($attributes['requires_unused'] ?? true),
                'requires_evidence' => (bool) ($attributes['requires_evidence'] ?? true),
                'return_shipping_paid_by' => ReturnShippingPaidBy::from((string) ($attributes['return_shipping_paid_by'] ?? 'customer')),
                'shipping_refundable' => (bool) ($attributes['shipping_refundable'] ?? false),
            ];

            if ($policy === null) {
                return VendorReturnPolicy::query()->create([
                    'vendor_account_id' => $vendorAccount->id,
                    ...$payload,
                ]);
            }

            $policy->update($payload);

            return $policy->fresh();
        });
    }

    public function getForAuthenticatedVendor(User $user): ?VendorReturnPolicy
    {
        $vendorAccount = $user->vendorAccount;

        if ($vendorAccount === null) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        return VendorReturnPolicy::query()
            ->where('vendor_account_id', $vendorAccount->id)
            ->first();
    }
}
