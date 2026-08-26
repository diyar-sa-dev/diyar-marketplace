<?php

namespace App\Services\Payments;

use App\Enums\PaymentStatus;
use App\Enums\PaymentWebhookProcessingStatus;
use App\Models\Payment;
use App\Models\PaymentWebhookEvent;
use App\Services\Order\PaymentStateService;
use App\Services\Payments\DTO\PaymentDetailsRequest;
use App\Services\Payments\DTO\VerifiedWebhookPayload;
use App\Services\Payments\Exceptions\PaymentGatewayException;
use Illuminate\Support\Facades\Log;

final class PaymentWebhookEventProcessor
{
    public function __construct(
        private readonly PaymentGatewayManager $gateways,
        private readonly PaymentFinalizationService $finalization,
        private readonly PaymentStateService $paymentStates,
    ) {}

    public function process(string $eventId): void
    {
        $event = PaymentWebhookEvent::query()->find($eventId);

        if ($event === null) {
            return;
        }

        if ($event->processing_status === PaymentWebhookProcessingStatus::Processed) {
            return;
        }

        if (! $event->signature_valid || $event->payment_id === null) {
            $event->update([
                'processing_status' => PaymentWebhookProcessingStatus::Failed,
                'processed_at' => now(),
            ]);

            return;
        }

        $payment = Payment::query()->find($event->payment_id);

        if ($payment === null) {
            $event->update([
                'processing_status' => PaymentWebhookProcessingStatus::Failed,
                'processed_at' => now(),
            ]);

            return;
        }

        $payload = is_array($event->payload) ? $event->payload : [];
        $mapped = $this->mapPayload($event, $payload);

        if ($mapped === null || $mapped->gatewayPaymentId === null) {
            $event->update([
                'processing_status' => PaymentWebhookProcessingStatus::Ignored,
                'processed_at' => now(),
            ]);

            return;
        }

        if ($payment->status === PaymentStatus::Paid) {
            $event->update([
                'processing_status' => PaymentWebhookProcessingStatus::Processed,
                'processed_at' => now(),
            ]);

            return;
        }

        try {
            $driver = $this->gateways->driver($payment->gateway);
            $details = $driver->getPaymentDetails(new PaymentDetailsRequest(
                gatewayPaymentId: $mapped->gatewayPaymentId,
                expectedReference: (string) $payment->payment_reference,
                expectedAmount: number_format((float) $payment->amount, 2, '.', ''),
                expectedCurrency: $payment->currency,
            ));
        } catch (PaymentGatewayException $exception) {
            $event->increment('processing_attempts');
            Log::warning('payment.webhook.processing_failed', [
                'event_id' => $event->id,
                'payment_id' => $payment->id,
                'message' => $exception->getMessage(),
            ]);

            return;
        }

        $this->applyProviderStatus($payment, $event, $details->status, $details->gatewayPaymentId, $details->gatewayInvoiceId, $details->failureReason);
    }

    private function applyProviderStatus(
        Payment $payment,
        PaymentWebhookEvent $event,
        PaymentStatus $status,
        ?string $gatewayPaymentId,
        ?string $gatewayInvoiceId,
        ?string $failureReason,
    ): void {
        if ($status === PaymentStatus::Paid) {
            $this->finalization->finalizePaid($payment, $gatewayPaymentId, $gatewayInvoiceId);
            $event->update([
                'processing_status' => PaymentWebhookProcessingStatus::Processed,
                'processed_at' => now(),
            ]);

            return;
        }

        if ($status === PaymentStatus::Processing || $status === PaymentStatus::RequiresAction) {
            $this->paymentStates->transition(
                $payment->fresh(),
                $status,
                source: 'webhook',
                correlationId: $event->correlation_id,
            );
            $event->update([
                'processing_status' => PaymentWebhookProcessingStatus::Processed,
                'processed_at' => now(),
            ]);

            return;
        }

        if ($status === PaymentStatus::Unknown) {
            $this->paymentStates->transition(
                $payment->fresh(),
                PaymentStatus::Unknown,
                source: 'webhook',
                correlationId: $event->correlation_id,
            );
            $event->update([
                'processing_status' => PaymentWebhookProcessingStatus::Processed,
                'processed_at' => now(),
            ]);

            return;
        }

        if ($status === PaymentStatus::Expired) {
            $this->finalization->markFailed($payment, $failureReason, PaymentStatus::Expired);
            $event->update([
                'processing_status' => PaymentWebhookProcessingStatus::Processed,
                'processed_at' => now(),
            ]);

            return;
        }

        if (in_array($status, [PaymentStatus::Failed, PaymentStatus::Cancelled], true)) {
            $this->finalization->markFailed($payment, $failureReason, $status);
            $event->update([
                'processing_status' => PaymentWebhookProcessingStatus::Processed,
                'processed_at' => now(),
            ]);

            return;
        }

        $event->update([
            'processing_status' => PaymentWebhookProcessingStatus::Ignored,
            'processed_at' => now(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function mapPayload(PaymentWebhookEvent $event, array $payload): ?VerifiedWebhookPayload
    {
        if ($event->gateway === 'fake') {
            $data = is_array($payload['data'] ?? null) ? $payload['data'] : $payload;

            return new VerifiedWebhookPayload(
                eventType: (string) ($data['EventType'] ?? $data['event_type'] ?? 'PaymentStatusChanged'),
                paymentReference: isset($data['CustomerReference']) ? (string) $data['CustomerReference'] : (isset($data['payment_reference']) ? (string) $data['payment_reference'] : null),
                gatewayPaymentId: isset($data['PaymentId']) ? (string) $data['PaymentId'] : (isset($data['gateway_payment_id']) ? (string) $data['gateway_payment_id'] : null),
                gatewayInvoiceId: isset($data['InvoiceId']) ? (string) $data['InvoiceId'] : null,
            );
        }

        $mapper = app(Gateways\MyFatoorah\MyFatoorahWebhookMapper::class);

        return $mapper->map($payload, (string) ($event->webhook_version ?? 'v2'));
    }
}
