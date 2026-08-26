<?php

namespace App\Services\Payments;

use App\Enums\AnalyticsEventType;
use App\Enums\OrderStatus;
use App\Enums\PaymentAttemptStatus;
use App\Enums\PaymentStatus;
use App\Enums\ReservationStatus;
use App\Events\Domain\PaymentFailed;
use App\Events\Domain\PaymentSucceeded;
use App\Models\InventoryReservation;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentAttempt;
use App\Services\Catalog\InventoryService;
use App\Services\Coupon\VendorCouponUsageService;
use App\Services\Analytics\AnalyticsEventRecorder;
use App\Services\Finance\FinancialPostingService;
use App\Services\Order\OrderStateService;
use App\Services\Order\PaymentStateService;
use App\Services\Payments\PaymentOutboxService;
use Illuminate\Support\Facades\DB;

final class PaymentFinalizationService
{
    public function __construct(
        private readonly PaymentStateService $paymentStates,
        private readonly OrderStateService $orderStates,
        private readonly InventoryService $inventory,
        private readonly PaymentAllocationSnapshotService $allocations,
        private readonly FinancialPostingService $financialPosting,
        private readonly VendorCouponUsageService $couponUsages,
        private readonly PaymentOutboxService $paymentOutbox,
        private readonly AnalyticsEventRecorder $analyticsEvents,
    ) {}

    public function finalizePaid(Payment $payment, ?string $gatewayPaymentId, ?string $gatewayInvoiceId): Payment
    {
        return DB::transaction(function () use ($payment, $gatewayPaymentId, $gatewayInvoiceId) {
            $payment = Payment::query()->whereKey($payment->id)->lockForUpdate()->firstOrFail();
            $order = Order::query()->whereKey($payment->order_id)->lockForUpdate()->firstOrFail();

            if ($payment->status === PaymentStatus::Paid) {
                return $payment;
            }

            $this->assertPaymentIntegrity($payment, $order);

            $this->paymentStates->transition($payment, PaymentStatus::Paid, array_filter([
                'gateway_payment_id' => $gatewayPaymentId,
                'gateway_invoice_id' => $gatewayInvoiceId,
            ]), source: 'finalization');

            $this->syncAttempts($payment, PaymentAttemptStatus::Paid);

            if ($order->status === OrderStatus::Pending) {
                $this->orderStates->confirm($order);
            }

            $order->loadMissing('user');

            $this->finalizeInventory($order);

            $this->financialPosting->postPaidPayment($payment->fresh(['vendorAllocations']));

            $this->couponUsages->recordForPaidOrder($order->fresh(['vendorOrders']));

            $payment = $payment->fresh();
            DB::afterCommit(function () use ($payment, $order): void {
                $this->paymentOutbox->publish(
                    'payment.paid',
                    (string) $payment->id,
                    [
                        'payment_id' => $payment->id,
                        'order_id' => $payment->order_id,
                        'status' => PaymentStatus::Paid->value,
                    ],
                    idempotencyKey: 'payment.paid:'.$payment->id,
                );
                $this->analyticsEvents->record(
                    AnalyticsEventType::PaymentCompleted,
                    user: $order->user,
                    subjectType: 'payment',
                    subjectId: $payment->id,
                    payload: ['order_id' => $payment->order_id],
                );
                event(new PaymentSucceeded($payment));
            });

            return $payment;
        });
    }

    public function markFailed(Payment $payment, ?string $reason = null, ?PaymentStatus $status = null): Payment
    {
        if ($payment->status === PaymentStatus::Paid) {
            return $payment;
        }

        $target = $status ?? PaymentStatus::Failed;

        if (! in_array($target, [PaymentStatus::Failed, PaymentStatus::Expired, PaymentStatus::Cancelled], true)) {
            $target = PaymentStatus::Failed;
        }

        $payment = $this->paymentStates->transition($payment, $target, array_filter([
            'failure_reason' => $reason,
        ]), source: 'finalization');

        $this->syncAttempts($payment, match ($target) {
            PaymentStatus::Expired => PaymentAttemptStatus::Expired,
            PaymentStatus::Cancelled => PaymentAttemptStatus::Failed,
            default => PaymentAttemptStatus::Failed,
        });

        $order = Order::query()->with('user')->find($payment->order_id);
        if ($order !== null) {
            $this->inventory->releasePendingForOrder(
                $order,
                finalStatus: $target === PaymentStatus::Expired
                    ? ReservationStatus::Expired
                    : ReservationStatus::Released,
            );
        }

        $payment = $payment->fresh();
        DB::afterCommit(function () use ($payment, $reason): void {
            $this->paymentOutbox->publish(
                'payment.failed',
                (string) $payment->id,
                [
                    'payment_id' => $payment->id,
                    'order_id' => $payment->order_id,
                    'status' => $payment->status->value,
                    'reason' => $reason,
                ],
                idempotencyKey: 'payment.failed:'.$payment->id.':'.$payment->status->value,
            );
            event(new PaymentFailed($payment, $reason));
        });

        return $payment;
    }

    public function markCancelled(Payment $payment, ?string $reason = null): Payment
    {
        return $this->markFailed($payment, $reason, PaymentStatus::Cancelled);
    }

    private function assertPaymentIntegrity(Payment $payment, Order $order): void
    {
        $paymentAmount = number_format((float) $payment->amount, 2, '.', '');
        $orderTotal = number_format((float) $order->grand_total, 2, '.', '');

        if (bccomp($paymentAmount, $orderTotal, 2) !== 0) {
            throw new \InvalidArgumentException(__('diyar.payment.amount_mismatch'));
        }

        $this->allocations->ensureSnapshotForPayment($payment);
        $this->allocations->assertAllocationsMatchPayment($payment);
    }

    private function syncAttempts(Payment $payment, PaymentAttemptStatus $status): void
    {
        PaymentAttempt::query()
            ->where('payment_id', $payment->id)
            ->whereIn('status', [
                PaymentAttemptStatus::Pending,
                PaymentAttemptStatus::SessionCreated,
                PaymentAttemptStatus::Submitted,
            ])
            ->update(['status' => $status]);
    }

    private function finalizeInventory(Order $order): void
    {
        $reservations = InventoryReservation::query()
            ->where('reference_type', Order::class)
            ->where('reference_id', $order->id)
            ->where('status', ReservationStatus::Pending)
            ->get();

        foreach ($reservations as $reservation) {
            $this->inventory->finalize($reservation, $order->user);
        }
    }
}
