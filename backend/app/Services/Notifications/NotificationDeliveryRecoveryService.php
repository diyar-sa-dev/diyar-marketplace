<?php

namespace App\Services\Notifications;

use App\Enums\NotificationDeliveryStatus;
use App\Enums\NotificationFailureCategory;
use App\Jobs\Notifications\DeliverNotificationChannelJob;
use App\Models\NotificationDelivery;
use App\Support\Notifications\NotificationQueue;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

final class NotificationDeliveryRecoveryService
{
    public function __construct(
        private readonly NotificationDeliveryStateMachine $stateMachine,
    ) {}

    /**
     * @return array{reset: int, redispatched: int, expired: int}
     */
    public function reconcile(int $stuckMinutes = 30, int $batchSize = 500): array
    {
        $now = Carbon::now();
        $stuckThreshold = $now->copy()->subMinutes($stuckMinutes);

        $reset = $this->recoverExpiredProcessingLeases($stuckThreshold, $batchSize);
        $redispatched = $this->redispatchDueRetries($now, $batchSize);
        $expired = $this->markExpiredRetriesFailed($now, $batchSize);

        return compact('reset', 'redispatched', 'expired');
    }

    public function redispatch(NotificationDelivery $delivery, array $payload = []): bool
    {
        if ($delivery->status->isTerminal() && $delivery->status !== NotificationDeliveryStatus::Failed) {
            return false;
        }

        $notification = $delivery->notification;

        if ($notification === null) {
            return false;
        }

        if ($payload === []) {
            $payload = is_array($notification->data) ? $notification->data : [];
        }

        if ($delivery->status === NotificationDeliveryStatus::Failed) {
            $this->stateMachine->transition($delivery, NotificationDeliveryStatus::Retrying, [
                'failed_at' => null,
                'next_retry_at' => now(),
            ]);
            $delivery->refresh();
        }

        DeliverNotificationChannelJob::dispatch($delivery->id, $payload)
            ->afterCommit()
            ->onQueue(NotificationQueue::forPriority($notification->priority));

        Log::info('notifications.delivery.redispatched', [
            'delivery_id' => $delivery->id,
            'channel' => $delivery->channel->value,
            'correlation_id' => $delivery->correlation_id,
        ]);

        return true;
    }

    private function recoverExpiredProcessingLeases(Carbon $stuckThreshold, int $batchSize): int
    {
        $deliveries = NotificationDelivery::query()
            ->where('status', NotificationDeliveryStatus::Processing)
            ->where(function ($query) use ($stuckThreshold) {
                $query->where(function ($leaseQuery) {
                    $leaseQuery->whereNotNull('processing_lease_until')
                        ->where('processing_lease_until', '<', now());
                })->orWhere(function ($legacyQuery) use ($stuckThreshold) {
                    $legacyQuery->whereNull('processing_lease_until')
                        ->where('last_attempt_at', '<', $stuckThreshold);
                });
            })
            ->limit($batchSize)
            ->get();

        $reset = 0;

        foreach ($deliveries as $delivery) {
            $claimed = DB::transaction(function () use ($delivery) {
                $current = NotificationDelivery::query()
                    ->where('id', $delivery->id)
                    ->where('status', NotificationDeliveryStatus::Processing)
                    ->lockForUpdate()
                    ->first();

                if ($current === null) {
                    return null;
                }

                return $this->stateMachine->markRetrying(
                    $current,
                    'Reconciled from expired processing lease.',
                    NotificationFailureCategory::Transient,
                    now(),
                );
            });

            if ($claimed !== null) {
                $this->redispatch($claimed);
                $reset++;
            }
        }

        return $reset;
    }

    private function redispatchDueRetries(Carbon $now, int $batchSize): int
    {
        $due = NotificationDelivery::query()
            ->where('status', NotificationDeliveryStatus::Retrying)
            ->where(function ($query) use ($now) {
                $query->whereNull('next_retry_at')
                    ->orWhere('next_retry_at', '<=', $now);
            })
            ->orderBy('next_retry_at')
            ->limit($batchSize)
            ->get();

        $redispatched = 0;

        foreach ($due as $delivery) {
            if ($this->redispatch($delivery)) {
                $redispatched++;
            }
        }

        return $redispatched;
    }

    private function markExpiredRetriesFailed(Carbon $now, int $batchSize): int
    {
        return NotificationDelivery::query()
            ->where('status', NotificationDeliveryStatus::Retrying)
            ->whereNotNull('next_retry_at')
            ->where('next_retry_at', '<', $now->copy()->subHours(24))
            ->limit($batchSize)
            ->update([
                'status' => NotificationDeliveryStatus::Failed,
                'failed_at' => $now,
                'last_error' => 'Retry window expired during reconciliation.',
                'failure_category' => NotificationFailureCategory::Permanent->value,
            ]);
    }
}
