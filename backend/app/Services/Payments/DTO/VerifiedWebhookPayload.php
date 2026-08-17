<?php

namespace App\Services\Payments\DTO;

final readonly class VerifiedWebhookPayload
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public string $eventType,
        public string $webhookVersion,
        public array $payload,
        public ?string $paymentReference,
        public ?string $gatewayPaymentId,
        public ?string $gatewayInvoiceId,
        public ?string $transactionStatus,
    ) {}
}
