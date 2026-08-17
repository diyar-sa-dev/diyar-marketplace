<?php

namespace App\Services\Payments;

use App\Enums\PaymentStatus;
use App\Enums\PaymentWebhookProcessingStatus;
use App\Models\Payment;
use App\Models\PaymentWebhookEvent;
use App\Services\Payments\DTO\PaymentDetailsRequest;
use App\Services\Payments\DTO\VerifiedWebhookPayload;
use App\Services\Payments\Exceptions\PaymentGatewayException;
use App\Services\Payments\Gateways\MyFatoorah\MyFatoorahWebhookMapper;
use App\Services\Payments\Gateways\MyFatoorah\MyFatoorahWebhookVerifier;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

final class PaymentWebhookProcessor
{
    public function __construct(
        private readonly PaymentGatewayManager $gateways,
        private readonly MyFatoorahWebhookVerifier $webhookVerifier,
        private readonly MyFatoorahWebhookMapper $webhookMapper,
        private readonly PaymentFinalizationService $finalization,
    ) {}

    /**
     * @param  array<string, string>  $headers
     * @return array{accepted: bool, duplicate: bool}
     */
    public function handle(string $gateway, string $rawBody, array $headers): array
    {
        $payload = json_decode($rawBody, true);

        if (! is_array($payload) || empty($payload['Data'])) {
            throw PaymentGatewayException::operationFailed(__('diyar.payment.invalid_webhook_payload'));
        }

        $signature = $headers['myfatoorah-signature'] ?? $headers['MyFatoorah-Signature'] ?? '';
        $webhookVersion = strtolower((string) ($headers['myfatoorah-webhook-version'] ?? $headers['MyFatoorah-Webhook-Version'] ?? 'v1'));
        $payloadHash = hash('sha256', $rawBody);

        try {
            return DB::transaction(function () use ($gateway, $payload, $signature, $webhookVersion, $payloadHash) {
                $existing = PaymentWebhookEvent::query()
                    ->where('payload_hash', $payloadHash)
                    ->lockForUpdate()
                    ->first();

                if ($existing !== null) {
                    return ['accepted' => true, 'duplicate' => true];
                }

                $secretKey = (string) config('myfatoorah.webhook_secret_key');
                $signatureValid = $signature !== '' && $this->webhookVerifier->verify($payload, $signature, $webhookVersion, $secretKey);
                $mapped = $this->webhookMapper->map($payload, $webhookVersion);
                $payment = $this->resolvePayment($mapped);

                $event = PaymentWebhookEvent::query()->create([
                    'gateway' => $gateway,
                    'event_type' => (string) $mapped->eventType,
                    'webhook_version' => $webhookVersion,
                    'signature_valid' => $signatureValid,
                    'payload_hash' => $payloadHash,
                    'payload' => $payload,
                    'processing_status' => $signatureValid
                        ? PaymentWebhookProcessingStatus::Pending
                        : PaymentWebhookProcessingStatus::Failed,
                    'payment_id' => $payment?->id,
                ]);

                if (! $signatureValid || $payment === null) {
                    return ['accepted' => false, 'duplicate' => false];
                }

                $this->processVerifiedEvent($event, $payment, $mapped);

                return ['accepted' => true, 'duplicate' => false];
            });
        } catch (QueryException $exception) {
            if (str_contains(strtolower($exception->getMessage()), 'payload_hash')) {
                return ['accepted' => true, 'duplicate' => true];
            }

            throw $exception;
        }
    }

    private function resolvePayment(VerifiedWebhookPayload $mapped): ?Payment
    {
        if ($mapped->paymentReference === null) {
            return null;
        }

        return Payment::query()
            ->where('payment_reference', $mapped->paymentReference)
            ->first();
    }

    private function processVerifiedEvent(
        PaymentWebhookEvent $event,
        Payment $payment,
        VerifiedWebhookPayload $mapped,
    ): void {
        if ($mapped->gatewayPaymentId === null) {
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

        $driver = $this->gateways->driver($payment->gateway);
        $details = $driver->getPaymentDetails(new PaymentDetailsRequest(
            gatewayPaymentId: $mapped->gatewayPaymentId,
            expectedReference: (string) $payment->payment_reference,
            expectedAmount: number_format((float) $payment->amount, 2, '.', ''),
            expectedCurrency: $payment->currency,
        ));

        if ($details->status === PaymentStatus::Paid) {
            $this->finalization->finalizePaid($payment, $details->gatewayPaymentId, $details->gatewayInvoiceId);
            $event->update([
                'processing_status' => PaymentWebhookProcessingStatus::Processed,
                'processed_at' => now(),
            ]);

            return;
        }

        if ($details->status === PaymentStatus::Expired) {
            $this->finalization->markFailed($payment, $details->failureReason, PaymentStatus::Expired);
            $event->update([
                'processing_status' => PaymentWebhookProcessingStatus::Processed,
                'processed_at' => now(),
            ]);

            return;
        }

        if (in_array($details->status, [PaymentStatus::Failed, PaymentStatus::Cancelled], true)) {
            $this->finalization->markFailed($payment, $details->failureReason, $details->status);
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
}
