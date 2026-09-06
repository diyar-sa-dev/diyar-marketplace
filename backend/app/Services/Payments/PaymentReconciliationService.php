<?php

namespace App\Services\Payments;

use App\Enums\PaymentAttemptStatus;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Services\Order\PaymentStateService;
use App\Services\Payments\DTO\PaymentDetailsRequest;
use App\Services\Payments\Exceptions\PaymentGatewayException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

final class PaymentReconciliationService
{
    public function __construct(
        private readonly PaymentGatewayManager $gateways,
        private readonly PaymentFinalizationService $finalization,
    ) {}

    /**
     * @return array{scanned: int, reconciled: int, failed: int, skipped: int}
     */
    public function reconcile(int $stuckMinutes = 30, int $batchSize = 100): array
    {
        $threshold = Carbon::now()->subMinutes($stuckMinutes);
        $stats = ['scanned' => 0, 'reconciled' => 0, 'failed' => 0, 'skipped' => 0];

        Payment::query()
            ->whereIn('status', [
                PaymentStatus::Pending->value,
                PaymentStatus::Processing->value,
                PaymentStatus::RequiresAction->value,
                PaymentStatus::Authorized->value,
                PaymentStatus::Unknown->value,
            ])
            ->whereHas('attempts', function ($query) use ($threshold): void {
                $query
                    ->where('status', PaymentAttemptStatus::Submitted->value)
                    ->whereNotNull('gateway_payment_id')
                    ->where('updated_at', '<=', $threshold);
            })
            ->with(['order', 'attempts' => fn ($query) => $query->latest('updated_at')])
            ->orderBy('updated_at')
            ->limit($batchSize)
            ->get()
            ->each(function (Payment $payment) use (&$stats): void {
                $stats['scanned']++;

                try {
                    if ($this->reconcilePayment($payment)) {
                        $stats['reconciled']++;
                    } else {
                        $stats['skipped']++;
                    }
                } catch (\Throwable $exception) {
                    $stats['failed']++;
                    Log::warning('payments.reconcile.failed', [
                        'payment_id' => $payment->id,
                        'order_id' => $payment->order_id,
                        'message' => $exception->getMessage(),
                    ]);
                }
            });

        return $stats;
    }

    private function reconcilePayment(Payment $payment): bool
    {
        if ($payment->order === null) {
            return false;
        }

        $attempt = $payment->attempts
            ->first(fn ($row) => $row->status === PaymentAttemptStatus::Submitted && $row->gateway_payment_id !== null);

        if ($attempt === null) {
            return false;
        }

        $gateway = $this->gateways->driver($payment->gateway);

        try {
            $details = $gateway->getPaymentDetails(new PaymentDetailsRequest(
                gatewayPaymentId: (string) $attempt->gateway_payment_id,
                expectedAmount: number_format((float) $payment->amount, 2, '.', ''),
                expectedCurrency: $payment->currency,
                expectedReference: (string) ($payment->payment_reference ?? $payment->order->order_number),
            ));
        } catch (PaymentGatewayException) {
            return false;
        }

        if ($details->status === PaymentStatus::Paid) {
            $this->finalization->finalizePaid(
                $payment->fresh(),
                $details->gatewayPaymentId ?? $attempt->gateway_payment_id,
                $details->gatewayInvoiceId ?? $attempt->gateway_invoice_id,
            );

            Log::info('payments.reconcile.paid', [
                'payment_id' => $payment->id,
                'order_id' => $payment->order_id,
                'gateway_payment_id' => $attempt->gateway_payment_id,
            ]);

            return true;
        }

        if (in_array($details->status, [PaymentStatus::Failed, PaymentStatus::Expired, PaymentStatus::Cancelled], true)) {
            $this->finalization->markFailed($payment->fresh(), $details->failureReason, $details->status);

            Log::info('payments.reconcile.terminal_failure', [
                'payment_id' => $payment->id,
                'order_id' => $payment->order_id,
                'status' => $details->status->value,
            ]);

            return true;
        }

        if ($details->status === PaymentStatus::Unknown) {
            app(PaymentStateService::class)->transition(
                $payment->fresh(),
                PaymentStatus::Unknown,
                source: 'reconciliation',
            );

            return true;
        }

        return false;
    }
}
