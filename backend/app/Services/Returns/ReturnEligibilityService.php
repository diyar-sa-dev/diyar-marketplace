<?php

namespace App\Services\Returns;

use App\Enums\PaymentStatus;
use App\Enums\ReturnReason;
use App\Enums\VendorOrderStatus;
use App\Models\OrderItem;
use App\Models\VendorOrder;
use App\Services\Returns\DTO\EffectiveReturnPolicy;
use Carbon\CarbonInterface;
use InvalidArgumentException;

final class ReturnEligibilityService
{
    public function __construct(
        private readonly EffectiveReturnPolicyService $policies,
        private readonly ReturnedQuantityService $returnedQuantities,
    ) {}

    /**
     * @return array{
     *   eligible: bool,
     *   policy: EffectiveReturnPolicy,
     *   deadline: ?string,
     *   remaining_quantity: int,
     *   reasons: list<string>
     * }
     */
    public function evaluateItem(
        VendorOrder $vendorOrder,
        OrderItem $orderItem,
        ?ReturnReason $reason = null,
    ): array {
        $vendorOrder->loadMissing(['order.payment', 'shipment', 'vendorAccount', 'items.product']);
        $orderItem->loadMissing('product');

        $product = $orderItem->product;
        if ($product === null) {
            throw new InvalidArgumentException(__('diyar.returns.product_not_found'));
        }

        $policy = $this->policies->resolveForProduct($vendorOrder->vendorAccount, $product);
        $remaining = $this->returnedQuantities->remainingQuantity($orderItem);
        $deadline = $this->resolveDeadline($vendorOrder);

        $paymentStatus = $vendorOrder->order?->payment?->status;
        $paymentEligible = in_array($paymentStatus, [PaymentStatus::Paid, PaymentStatus::PartiallyRefunded], true);

        $eligible = $policy->returnable
            && $vendorOrder->status === VendorOrderStatus::Delivered
            && $paymentEligible
            && $remaining > 0
            && ($deadline === null || now()->lte($deadline));

        if ($reason !== null && ! in_array($reason->value, $policy->acceptedReasons, true)) {
            $eligible = false;
        }

        return [
            'eligible' => $eligible,
            'policy' => $policy,
            'deadline' => $deadline?->toIso8601String(),
            'remaining_quantity' => $remaining,
            'reasons' => $policy->acceptedReasons,
        ];
    }

    public function assertCanRequest(
        VendorOrder $vendorOrder,
        OrderItem $orderItem,
        ReturnReason $reason,
        int $quantity,
    ): EffectiveReturnPolicy {
        $evaluation = $this->evaluateItem($vendorOrder, $orderItem, $reason);

        if (! $evaluation['eligible']) {
            throw new InvalidArgumentException(__('diyar.returns.not_eligible'));
        }

        if ($quantity < 1 || $quantity > $evaluation['remaining_quantity']) {
            throw new InvalidArgumentException(__('diyar.returns.invalid_quantity'));
        }

        /** @var EffectiveReturnPolicy $policy */
        $policy = $evaluation['policy'];

        if ($policy->requiresEvidence === false && $reason === ReturnReason::Other) {
            // allowed
        }

        if (! in_array($reason->value, $policy->acceptedReasons, true)) {
            throw new InvalidArgumentException(__('diyar.returns.reason_not_accepted'));
        }

        return $policy;
    }

    private function resolveDeadline(VendorOrder $vendorOrder): ?CarbonInterface
    {
        $deliveredAt = $vendorOrder->shipment?->delivered_at;
        if ($deliveredAt === null) {
            return null;
        }

        $product = $vendorOrder->items->first()?->product;
        if ($product === null) {
            return null;
        }

        $policy = $this->policies->resolveForProduct($vendorOrder->vendorAccount, $product);

        if ($policy->returnWindowDays <= 0) {
            return null;
        }

        return $deliveredAt->copy()->addDays($policy->returnWindowDays)->endOfDay();
    }
}
