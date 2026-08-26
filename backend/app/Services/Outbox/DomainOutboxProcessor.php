<?php

namespace App\Services\Outbox;

use App\Enums\DomainOutboxEventStatus;
use App\Enums\NotificationPriority;
use App\Jobs\Notifications\DeliverNotificationChannelJob;
use App\Models\DomainOutboxEvent;
use App\Support\Notifications\NotificationQueue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

final class DomainOutboxProcessor
{
    public function process(DomainOutboxEvent $event): void
    {
        match ($event->event_type) {
            'notification.delivery.dispatch' => $this->dispatchNotificationDelivery($event),
            default => throw new \InvalidArgumentException("Unsupported outbox event type: {$event->event_type}"),
        };
    }

    private function dispatchNotificationDelivery(DomainOutboxEvent $event): void
    {
        $deliveryId = is_string($event->payload['delivery_id'] ?? null)
            ? $event->payload['delivery_id']
            : $event->aggregate_id;
        $payload = is_array($event->payload['payload'] ?? null) ? $event->payload['payload'] : [];
        $priorityValue = is_string($event->payload['priority'] ?? null) ? $event->payload['priority'] : 'normal';
        $priority = NotificationPriority::tryFrom($priorityValue) ?? NotificationPriority::Normal;

        DeliverNotificationChannelJob::dispatch($deliveryId, $payload)
            ->onQueue(NotificationQueue::forPriority($priority));

        Log::info('outbox.notification.delivery.dispatched', [
            'outbox_event_id' => $event->id,
            'delivery_id' => $deliveryId,
            'correlation_id' => $event->correlation_id,
        ]);
    }

    public function markProcessed(DomainOutboxEvent $event): void
    {
        $event->update([
            'status' => DomainOutboxEventStatus::Processed,
            'processed_at' => now(),
            'locked_at' => null,
            'locked_by' => null,
            'last_error' => null,
        ]);
    }

    public function markRetry(DomainOutboxEvent $event, Throwable $exception, int $delaySeconds): void
    {
        $event->update([
            'status' => DomainOutboxEventStatus::Pending,
            'available_at' => now()->addSeconds($delaySeconds),
            'locked_at' => null,
            'locked_by' => null,
            'last_error' => $exception->getMessage(),
            'attempts' => $event->attempts + 1,
        ]);
    }

    public function markDeadLetter(DomainOutboxEvent $event, Throwable $exception): void
    {
        $event->update([
            'status' => DomainOutboxEventStatus::DeadLetter,
            'processed_at' => now(),
            'locked_at' => null,
            'locked_by' => null,
            'last_error' => $exception->getMessage(),
        ]);
    }

    /**
     * @return list<DomainOutboxEvent>
     */
    public function claimBatch(int $limit = 100, int $leaseSeconds = 120): array
    {
        $workerId = (string) str()->uuid();
        $now = now();
        $leaseUntil = $now->copy()->addSeconds($leaseSeconds);

        return DB::transaction(function () use ($limit, $workerId, $now, $leaseUntil) {
            $events = DomainOutboxEvent::query()
                ->where('status', DomainOutboxEventStatus::Pending)
                ->where('available_at', '<=', $now)
                ->orderBy('available_at')
                ->limit($limit)
                ->lockForUpdate()
                ->get();

            $claimed = [];

            foreach ($events as $event) {
                $updated = DomainOutboxEvent::query()
                    ->where('id', $event->id)
                    ->where('status', DomainOutboxEventStatus::Pending)
                    ->update([
                        'status' => DomainOutboxEventStatus::Processing,
                        'locked_at' => $now,
                        'locked_by' => $workerId,
                        'attempts' => $event->attempts + 1,
                    ]);

                if ($updated === 1) {
                    $claimed[] = $event->fresh();
                }
            }

            return $claimed;
        });
    }

    public function recoverExpiredLeases(int $batchSize = 200): int
    {
        $threshold = now()->subMinutes(5);

        return DomainOutboxEvent::query()
            ->where('status', DomainOutboxEventStatus::Processing)
            ->where('locked_at', '<', $threshold)
            ->limit($batchSize)
            ->update([
                'status' => DomainOutboxEventStatus::Pending,
                'available_at' => now(),
                'locked_at' => null,
                'locked_by' => null,
                'last_error' => 'Recovered from expired outbox lease.',
            ]);
    }
}
