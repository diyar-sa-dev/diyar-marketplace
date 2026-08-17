<?php

namespace App\Services\Order;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\VendorOrder;
use InvalidArgumentException;

final class OrderTotalsReconciliationService
{
    public function assertOrderInvariants(Order $order): void
    {
        $order->loadMissing(['vendorOrders.items']);

        $itemsSubtotal = '0.00';
        $vendorShipping = '0.00';
        $vendorTotals = '0.00';
        $vendorVat = '0.00';

        foreach ($order->vendorOrders as $vendorOrder) {
            $vendorShipping = bcadd($vendorShipping, (string) $vendorOrder->shipping_cost, 2);
            $vendorTotals = bcadd($vendorTotals, (string) $vendorOrder->vendor_total, 2);
            $vendorVat = bcadd($vendorVat, (string) $vendorOrder->vat_amount, 2);

            $groupSubtotal = '0.00';
            foreach ($vendorOrder->items as $item) {
                $itemsSubtotal = bcadd($itemsSubtotal, (string) $item->line_subtotal, 2);
                $groupSubtotal = bcadd($groupSubtotal, (string) $item->line_subtotal, 2);
            }

            if (bccomp($groupSubtotal, (string) $vendorOrder->subtotal, 2) !== 0) {
                throw new InvalidArgumentException(__('diyar.order.invariant_vendor_subtotal'));
            }
        }

        if (bccomp($itemsSubtotal, (string) $order->subtotal, 2) !== 0) {
            throw new InvalidArgumentException(__('diyar.order.invariant_order_subtotal'));
        }

        if (bccomp($vendorShipping, (string) $order->shipping_total, 2) !== 0) {
            throw new InvalidArgumentException(__('diyar.order.invariant_shipping_total'));
        }

        if (bccomp($vendorVat, (string) $order->vat_amount, 2) !== 0) {
            throw new InvalidArgumentException(__('diyar.order.invariant_vat_total'));
        }

        $expectedGrand = bcadd(
            bcadd(
                bcadd((string) $order->subtotal, (string) $order->shipping_total, 2),
                (string) $order->assembly_total,
                2
            ),
            (string) $order->vat_amount,
            2
        );
        $expectedGrand = bcsub($expectedGrand, (string) $order->discount_total, 2);

        if (bccomp($expectedGrand, (string) $order->grand_total, 2) !== 0) {
            throw new InvalidArgumentException(__('diyar.order.invariant_grand_total'));
        }
    }

    public function sumLineSubtotals(VendorOrder $vendorOrder): string
    {
        $total = '0.00';

        /** @var OrderItem $item */
        foreach ($vendorOrder->items as $item) {
            $total = bcadd($total, (string) $item->line_subtotal, 2);
        }

        return $total;
    }
}
