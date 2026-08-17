<?php

namespace App\Services\Order;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\VendorOrderStatus;
use App\Models\Order;
use App\Models\VendorOrder;
use InvalidArgumentException;

final class OrderCancellationService
{
    public function __construct(
        private readonly OrderStateService $orderState,
        private readonly PaymentStateService $paymentState,
    ) {}

    public function cancel(Order $order): Order
    {
        if ($order->status !== OrderStatus::Pending) {
            throw new InvalidArgumentException(__('diyar.order.invalid_status_transition'));
        }

        $order = $this->orderState->cancel($order);

        $payment = $order->payment;

        if ($payment !== null && $payment->status === PaymentStatus::Pending) {
            $this->paymentState->transition($payment, PaymentStatus::Cancelled, [
                'failure_reason' => __('diyar.payment.cancelled_with_order'),
            ]);
        }

        return $order->fresh(['payment', 'vendorOrders.items', 'vendorOrders.vendorAccount']);
    }

    /**
     * When every vendor sub-order is cancelled, cancel the marketplace order too.
     */
    public function reconcileAfterVendorOrderCancelled(VendorOrder $vendorOrder): void
    {
        $order = Order::query()
            ->with(['vendorOrders', 'payment'])
            ->find($vendorOrder->order_id);

        if ($order === null || $order->status === OrderStatus::Cancelled) {
            return;
        }

        $vendorOrders = $order->vendorOrders;

        if ($vendorOrders->isEmpty()) {
            return;
        }

        $allCancelled = $vendorOrders->every(
            fn (VendorOrder $vo) => $vo->status === VendorOrderStatus::Cancelled,
        );

        if (! $allCancelled) {
            return;
        }

        if ($order->status === OrderStatus::Pending) {
            $this->cancel($order);

            return;
        }

        $payment = $order->payment;

        if ($payment !== null && $payment->status === PaymentStatus::Paid) {
            return;
        }

        if ($payment !== null && $payment->status === PaymentStatus::Pending) {
            $this->paymentState->transition($payment, PaymentStatus::Cancelled, [
                'failure_reason' => __('diyar.payment.cancelled_with_order'),
            ]);
        }

        try {
            $this->orderState->cancel($order);
        } catch (InvalidArgumentException) {
            // Order may already be in a terminal state.
        }
    }
}
