<?php

namespace App\Services\Returns;

use App\Contracts\Payments\PaymentGatewayInterface;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Enums\ReturnRequestStatus;
use App\Models\Payment;
use App\Models\PaymentVendorAllocation;
use App\Models\Refund;
use App\Models\ReturnRequest;
use App\Services\Finance\FinancialPostingService;
use App\Services\Order\PaymentStateService;
use App\Services\Payments\DTO\RefundPaymentRequest;
use App\Services\Payments\Exceptions\PaymentGatewayException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class RefundProcessingService
{
    public function __construct(
        private readonly RefundCalculationService $calculator,
        private readonly ReturnReferenceService $references,
        private readonly FinancialPostingService $posting,
        private readonly PaymentStateService $paymentState,
        private readonly ReturnStateService $returnState,
        private readonly PaymentGatewayInterface $gateway,
    ) {}

    public function process(ReturnRequest $returnRequest, string $idempotencyKey): Refund
    {
        $existing = Refund::query()->where('idempotency_key', $idempotencyKey)->first();
        if ($existing !== null) {
            return $existing->fresh(['returnRequest']);
        }

        if ($returnRequest->status !== ReturnRequestStatus::Inspected) {
            throw new InvalidArgumentException(__('diyar.returns.not_ready_for_refund'));
        }

        if ($returnRequest->refund()->exists()) {
            throw new InvalidArgumentException(__('diyar.returns.already_refunded'));
        }

        $returnRequest->loadMissing(['items.orderItem', 'vendorOrder.order.payment', 'order']);

        $calculation = $this->calculator->calculate($returnRequest);
        $payment = $returnRequest->order?->payment;

        if ($payment === null || $payment->status === PaymentStatus::Refunded) {
            throw new InvalidArgumentException(__('diyar.returns.payment_not_refundable'));
        }

        if (bccomp($calculation->totalAmount, '0.00', 2) <= 0) {
            throw new InvalidArgumentException(__('diyar.returns.invalid_refund_amount'));
        }

        $paymentAmount = number_format((float) $payment->amount, 2, '.', '');
        $alreadyRefunded = number_format((float) Refund::query()
            ->where('payment_id', $payment->id)
            ->where('status', RefundStatus::Completed)
            ->sum('total_amount'), 2, '.', '');
        $remainingRefundable = bcsub($paymentAmount, $alreadyRefunded, 2);

        if (bccomp($calculation->totalAmount, $remainingRefundable, 2) > 0) {
            throw new InvalidArgumentException(__('diyar.returns.refund_exceeds_paid'));
        }

        $allocation = $returnRequest->vendorOrder?->id
            ? PaymentVendorAllocation::query()
                ->where('vendor_order_id', $returnRequest->vendor_order_id)
                ->first()
            : null;

        try {
            return DB::transaction(function () use ($returnRequest, $idempotencyKey, $calculation, $payment, $allocation) {
                $refund = Refund::query()->create([
                    'reference' => $this->references->nextRefundReference(),
                    'return_request_id' => $returnRequest->id,
                    'order_id' => $returnRequest->order_id,
                    'vendor_order_id' => $returnRequest->vendor_order_id,
                    'payment_id' => $payment->id,
                    'payment_vendor_allocation_id' => $allocation?->id,
                    'status' => RefundStatus::Processing,
                    'items_subtotal' => $calculation->itemsSubtotal,
                    'vat_amount' => $calculation->vatAmount,
                    'shipping_amount' => $calculation->shippingAmount,
                    'total_amount' => $calculation->totalAmount,
                    'vendor_payable_reversal' => $calculation->vendorPayableReversal,
                    'commission_reversal' => $calculation->commissionReversal,
                    'currency' => $calculation->currency,
                    'idempotency_key' => $idempotencyKey,
                    'breakdown' => $calculation->breakdown,
                ]);

                $gatewayResult = $this->gateway->refund(new RefundPaymentRequest(
                    gatewayPaymentId: (string) $payment->gateway_payment_id,
                    paymentReference: (string) $payment->payment_reference,
                    amount: $calculation->totalAmount,
                    currency: $calculation->currency,
                    refundReference: $refund->reference,
                    reason: 'return_'.$returnRequest->reference,
                ));

                if (! $gatewayResult->success) {
                    throw new PaymentGatewayException($gatewayResult->failureReason ?? __('diyar.payment.gateway_error'));
                }

                $refund->update([
                    'gateway_refund_id' => $gatewayResult->gatewayRefundId,
                    'status' => RefundStatus::Completed,
                    'processed_at' => now(),
                ]);

                $this->posting->postRefund($refund->fresh());
                $this->transitionPaymentAfterRefund($payment->fresh());
                $this->returnState->transition($returnRequest->fresh(), ReturnRequestStatus::Refunded);

                return $refund->fresh(['returnRequest.items', 'returnRequest.refund']);
            });
        } catch (QueryException $exception) {
            if (str_contains(strtolower($exception->getMessage()), 'refunds_idempotency_key_unique')
                || str_contains(strtolower($exception->getMessage()), 'duplicate')) {
                return Refund::query()->where('idempotency_key', $idempotencyKey)->firstOrFail();
            }

            throw $exception;
        }
    }

    private function transitionPaymentAfterRefund(Payment $payment): void
    {
        $totalRefunded = Refund::query()
            ->where('payment_id', $payment->id)
            ->where('status', RefundStatus::Completed)
            ->sum('total_amount');

        $paymentAmount = number_format((float) $payment->amount, 2, '.', '');
        $refundedTotal = number_format((float) $totalRefunded, 2, '.', '');

        $target = bccomp($refundedTotal, $paymentAmount, 2) >= 0
            ? PaymentStatus::Refunded
            : PaymentStatus::PartiallyRefunded;

        if ($payment->status !== $target) {
            $this->paymentState->transition($payment, $target);
        }
    }
}
