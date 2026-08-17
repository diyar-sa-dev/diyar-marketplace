<?php

namespace App\Services\Returns;

use App\Models\Product;
use App\Models\VendorAccount;
use App\Models\VendorReturnPolicy;
use App\Services\Returns\DTO\EffectiveReturnPolicy;

final class EffectiveReturnPolicyService
{
    public function resolveForProduct(VendorAccount $vendorAccount, Product $product): EffectiveReturnPolicy
    {
        $platform = (array) config('diyar.returns.platform_baseline', []);
        $vendorPolicy = VendorReturnPolicy::query()
            ->where('vendor_account_id', $vendorAccount->id)
            ->first();

        $base = [
            'returnable' => (bool) ($platform['returnable'] ?? true),
            'return_window_days' => (int) ($platform['return_window_days'] ?? 14),
            'accepted_reasons' => (array) ($platform['accepted_reasons'] ?? []),
            'requires_unused' => (bool) ($platform['requires_unused'] ?? true),
            'requires_evidence' => (bool) ($platform['requires_evidence'] ?? true),
            'return_shipping_paid_by' => (string) ($platform['return_shipping_paid_by'] ?? 'customer'),
            'shipping_refundable' => (bool) ($platform['shipping_refundable'] ?? false),
        ];

        if ($vendorPolicy !== null) {
            $base = [
                'returnable' => $vendorPolicy->returnable,
                'return_window_days' => $vendorPolicy->return_window_days,
                'accepted_reasons' => $vendorPolicy->accepted_reasons,
                'requires_unused' => $vendorPolicy->requires_unused,
                'requires_evidence' => $vendorPolicy->requires_evidence,
                'return_shipping_paid_by' => $vendorPolicy->return_shipping_paid_by->value,
                'shipping_refundable' => $vendorPolicy->shipping_refundable,
            ];
        }

        $source = $vendorPolicy !== null ? 'vendor' : 'platform';

        if ($product->return_policy_override_enabled) {
            $source = 'product';

            if ($product->returnable !== null) {
                $base['returnable'] = $product->returnable;
            }
            if ($product->return_window_days !== null) {
                $base['return_window_days'] = (int) $product->return_window_days;
            }
            if ($product->return_accepted_reasons !== null) {
                $base['accepted_reasons'] = $product->return_accepted_reasons;
            }
            if ($product->return_requires_unused !== null) {
                $base['requires_unused'] = $product->return_requires_unused;
            }
            if ($product->return_requires_evidence !== null) {
                $base['requires_evidence'] = $product->return_requires_evidence;
            }
            if ($product->return_shipping_paid_by !== null) {
                $base['return_shipping_paid_by'] = $product->return_shipping_paid_by;
            }
            if ($product->return_shipping_refundable !== null) {
                $base['shipping_refundable'] = $product->return_shipping_refundable;
            }
        }

        return new EffectiveReturnPolicy(
            returnable: $base['returnable'],
            returnWindowDays: max(0, (int) $base['return_window_days']),
            acceptedReasons: array_values(array_unique(array_map('strval', $base['accepted_reasons']))),
            requiresUnused: $base['requires_unused'],
            requiresEvidence: $base['requires_evidence'],
            returnShippingPaidBy: $base['return_shipping_paid_by'],
            shippingRefundable: $base['shipping_refundable'],
            source: $source,
        );
    }
}
