<?php

namespace App\Services\Payments;

use App\Services\Outbox\DomainOutboxPublisher;
use Illuminate\Support\Str;

final class PaymentOutboxService
{
    public function __construct(
        private readonly DomainOutboxPublisher $outbox,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function publish(
        string $eventType,
        string $paymentId,
        array $payload,
        ?string $idempotencyKey = null,
        ?string $correlationId = null,
    ): void {
        if (! config('diyar.outbox.enabled', true)) {
            return;
        }

        $this->outbox->publish(
            eventType: $eventType,
            aggregateType: 'payment',
            aggregateId: $paymentId,
            payload: $payload,
            idempotencyKey: $idempotencyKey,
            correlationId: $correlationId ?? (string) Str::uuid(),
        );
    }
}
