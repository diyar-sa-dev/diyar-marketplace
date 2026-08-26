<?php

namespace App\Services\Payments;

use App\Enums\PaymentWebhookProcessingStatus;
use App\Jobs\Payments\ProcessPaymentWebhookJob;
use App\Models\Payment;
use App\Models\PaymentWebhookEvent;
use App\Services\Payments\DTO\VerifiedWebhookPayload;
use App\Services\Payments\Exceptions\PaymentGatewayException;
use App\Services\Payments\Gateways\MyFatoorah\MyFatoorahWebhookMapper;
use App\Services\Payments\Gateways\MyFatoorah\MyFatoorahWebhookVerifier;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class PaymentWebhookProcessor
{
    public function __construct(
        private readonly MyFatoorahWebhookVerifier $webhookVerifier,
        private readonly MyFatoorahWebhookMapper $webhookMapper,
    ) {}

    /**
     * @param  array<string, string>  $headers
     * @return array{accepted: bool, duplicate: bool, event_id: string|null}
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
        $correlationId = (string) Str::uuid();

        try {
            return DB::transaction(function () use ($gateway, $payload, $signature, $webhookVersion, $payloadHash, $correlationId) {
                $existing = PaymentWebhookEvent::query()
                    ->where('payload_hash', $payloadHash)
                    ->lockForUpdate()
                    ->first();

                if ($existing !== null) {
                    return ['accepted' => true, 'duplicate' => true, 'event_id' => $existing->id];
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
                    'correlation_id' => $correlationId,
                ]);

                if (! $signatureValid || $payment === null) {
                    return ['accepted' => false, 'duplicate' => false, 'event_id' => $event->id];
                }

                ProcessPaymentWebhookJob::dispatch($event->id, $correlationId);

                return ['accepted' => true, 'duplicate' => false, 'event_id' => $event->id];
            });
        } catch (QueryException $exception) {
            if (str_contains(strtolower($exception->getMessage()), 'payload_hash')) {
                return ['accepted' => true, 'duplicate' => true, 'event_id' => null];
            }

            throw $exception;
        }
    }

    /**
     * Fake/dev webhook ingestion without provider signature requirements.
     *
     * @param  array<string, mixed>  $payload
     * @return array{accepted: bool, duplicate: bool, event_id: string|null}
     */
    public function ingestFake(array $payload): array
    {
        if (! config('diyar.payments.use_fake_gateway')) {
            throw PaymentGatewayException::operationFailed(__('diyar.payment.simulation_unavailable'));
        }

        $rawBody = json_encode($payload, JSON_THROW_ON_ERROR);
        $payloadHash = hash('sha256', $rawBody);
        $correlationId = (string) Str::uuid();
        $data = is_array($payload['data'] ?? null) ? $payload['data'] : $payload;
        $reference = (string) ($data['payment_reference'] ?? $data['CustomerReference'] ?? '');

        $payment = $reference !== ''
            ? Payment::query()->where('payment_reference', $reference)->first()
            : null;

        try {
            return DB::transaction(function () use ($payload, $payloadHash, $correlationId, $payment, $data) {
                $existing = PaymentWebhookEvent::query()
                    ->where('payload_hash', $payloadHash)
                    ->lockForUpdate()
                    ->first();

                if ($existing !== null) {
                    return ['accepted' => true, 'duplicate' => true, 'event_id' => $existing->id];
                }

                $event = PaymentWebhookEvent::query()->create([
                    'gateway' => 'fake',
                    'event_type' => (string) ($data['event_type'] ?? 'PaymentStatusChanged'),
                    'webhook_version' => 'fake',
                    'signature_valid' => true,
                    'payload_hash' => $payloadHash,
                    'payload' => $payload,
                    'processing_status' => PaymentWebhookProcessingStatus::Pending,
                    'payment_id' => $payment?->id,
                    'correlation_id' => $correlationId,
                ]);

                ProcessPaymentWebhookJob::dispatch($event->id, $correlationId);

                return ['accepted' => true, 'duplicate' => false, 'event_id' => $event->id];
            });
        } catch (QueryException $exception) {
            if (str_contains(strtolower($exception->getMessage()), 'payload_hash')) {
                return ['accepted' => true, 'duplicate' => true, 'event_id' => null];
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
}
