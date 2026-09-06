<?php

namespace App\Services\Returns;

use App\Models\PaymentVendorAllocation;
use App\Models\ReturnRequest;
use App\Services\Returns\DTO\RefundCalculationResult;
use InvalidArgumentException;

final class RefundCalculationService
{
    public function calculate(ReturnRequest $returnRequest): RefundCalculationResult
    {
        $returnRequest->loadMissing(['items.orderItem', 'vendorOrder']);

        $vendorOrder = $returnRequest->vendorOrder;
        if ($vendorOrder === null) {
            throw new InvalidArgumentException(__('diyar.returns.vendor_order_not_found'));
        }

        $allocation = PaymentVendorAllocation::query()
            ->where('vendor_order_id', $vendorOrder->id)
            ->first();

        if ($allocation === null) {
            throw new InvalidArgumentException(__('diyar.returns.allocation_not_found'));
        }

        $itemsSubtotal = '0.00';
        foreach ($returnRequest->items as $item) {
            $itemsSubtotal = bcadd($itemsSubtotal, number_format((float) $item->line_subtotal, 2, '.', ''), 2);
        }

        $vendorSubtotal = number_format((float) $vendorOrder->subtotal, 2, '.', '');
        $discountSnapshot = number_format((float) ($vendorOrder->discount_amount ?? 0), 2, '.', '');
        if (bccomp($vendorSubtotal, '0.00', 2) > 0 && bccomp($discountSnapshot, '0.00', 2) > 0) {
            $discountShare = bcmul(
                bcdiv($itemsSubtotal, $vendorSubtotal, 8),
                $discountSnapshot,
                8,
            );
            $itemsSubtotal = bcsub($itemsSubtotal, number_format((float) $discountShare, 2, '.', ''), 2);
            if (bccomp($itemsSubtotal, '0.00', 2) < 0) {
                $itemsSubtotal = '0.00';
            }
        }

        $allocationSubtotal = number_format((float) $allocation->vendor_subtotal, 2, '.', '');
        $itemRatio = bccomp($allocationSubtotal, '0.00', 2) > 0
            ? bcdiv($itemsSubtotal, $allocationSubtotal, 8)
            : '0';

        $vatAmount = $this->proportionalAmount((string) $allocation->vat_amount, $itemRatio);
        $shippingAmount = '0.00';

        $policySnapshot = (array) $returnRequest->policy_snapshot;
        $historicalShipping = number_format((float) $vendorOrder->shipping_cost, 2, '.', '');

        if (
            ReturnPolicySnapshot::shippingRefundable($policySnapshot)
            && $this->coversFullVendorOrderReturn($returnRequest, $vendorOrder)
        ) {
            $shippingAmount = $historicalShipping;
            $shippingVatShare = bccomp($allocationSubtotal, '0.00', 2) > 0
                ? bcmul(
                    bcdiv((string) $allocation->vat_amount, $allocationSubtotal, 8),
                    $shippingAmount,
                    8,
                )
                : '0.00';
            $vatAmount = bcadd($vatAmount, number_format((float) $shippingVatShare, 2, '.', ''), 2);
        }

        $grossRefund = bcadd(bcadd($itemsSubtotal, $vatAmount, 2), $shippingAmount, 2);
        $allocationGross = number_format((float) $allocation->vendor_gross_total, 2, '.', '');
        $grossRatio = bccomp($allocationGross, '0.00', 2) > 0
            ? bcdiv($grossRefund, $allocationGross, 8)
            : '0';

        $commissionReversal = $this->proportionalAmount((string) $allocation->platform_commission_amount, $grossRatio);
        $vendorPayableReversal = bcsub($grossRefund, $commissionReversal, 2);

        return new RefundCalculationResult(
            itemsSubtotal: $itemsSubtotal,
            vatAmount: $vatAmount,
            shippingAmount: $shippingAmount,
            totalAmount: $grossRefund,
            vendorPayableReversal: $vendorPayableReversal,
            commissionReversal: $commissionReversal,
            currency: $allocation->currency,
            breakdown: [
                'allocation_id' => $allocation->id,
                'item_ratio' => $itemRatio,
                'gross_ratio' => $grossRatio,
                'allocation_subtotal' => $allocationSubtotal,
                'allocation_gross_total' => $allocationGross,
                'shipping_refundable' => ReturnPolicySnapshot::shippingRefundable($policySnapshot),
                'full_vendor_order_return' => $this->coversFullVendorOrderReturn($returnRequest, $vendorOrder),
                'historical_shipping_cost' => $historicalShipping,
            ],
        );
    }

    private function proportionalAmount(string $amount, string $ratio): string
    {
        if (bccomp($amount, '0.00', 2) <= 0 || bccomp($ratio, '0', 8) <= 0) {
            return '0.00';
        }

        return $this->roundMoney(bcmul($amount, $ratio, 6));
    }

    private function roundMoney(string $amount): string
    {
        if (bccomp($amount, '0', 6) === 0) {
            return '0.00';
        }

        $sign = bccomp($amount, '0', 6) < 0 ? '-' : '';
        $absolute = ltrim($amount, '-');
        $scaled = bcadd(bcmul($absolute, '100', 4), '0.5', 0);
        $rounded = bcdiv($scaled, '100', 2);

        return $sign === '-' ? '-'.$rounded : $rounded;
    }

    private function coversFullVendorOrderReturn(ReturnRequest $returnRequest, $vendorOrder): bool
    {
        $vendorOrder->loadMissing('items');
        $returnedQuantities = app(ReturnedQuantityService::class);

        foreach ($vendorOrder->items as $orderItem) {
            if ($returnedQuantities->remainingQuantity($orderItem) > 0) {
                return false;
            }
        }

        return $vendorOrder->items->isNotEmpty();
    }
}
