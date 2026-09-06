<?php

namespace App\Services\Outbox;

use App\Enums\DomainOutboxEventStatus;
use App\Models\DomainOutboxEvent;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

final class DomainOutboxPublisher
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function publish(
        string $eventType,
        string $aggregateType,
        string $aggregateId,
        array $payload,
        ?string $idempotencyKey = null,
        ?string $correlationId = null,
        ?Carbon $availableAt = null,
    ): ?DomainOutboxEvent {
        $correlationId ??= (string) Str::uuid();
        $now = now();

        try {
            return DomainOutboxEvent::query()->create([
                'aggregate_type' => $aggregateType,
                'aggregate_id' => $aggregateId,
                'event_type' => $eventType,
                'payload' => $payload,
                'occurred_at' => $now,
                'available_at' => $availableAt ?? $now,
                'status' => DomainOutboxEventStatus::Pending,
                'correlation_id' => $correlationId,
                'idempotency_key' => $idempotencyKey,
            ]);
        } catch (QueryException $exception) {
            if ($idempotencyKey !== null && $this->isDuplicateKey($exception)) {
                return DomainOutboxEvent::query()
                    ->where('idempotency_key', $idempotencyKey)
                    ->first();
            }

            throw $exception;
        }
    }

    private function isDuplicateKey(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'unique') || str_contains($message, 'duplicate');
    }
}
