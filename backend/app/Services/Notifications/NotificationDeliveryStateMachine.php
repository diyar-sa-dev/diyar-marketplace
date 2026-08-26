<?php

namespace App\Services\Notifications;

use App\Enums\NotificationDeliveryStatus;
use App\Enums\NotificationFailureCategory;
use App\Models\NotificationDelivery;
use Illuminate\Support\Str;
use InvalidArgumentException;

final class NotificationDeliveryStateMachine
{
    /** @var array<string, list<NotificationDeliveryStatus>> */
    private const TRANSITIONS = [
        'pending' => [
            NotificationDeliveryStatus::Queued,
            NotificationDeliveryStatus::Processing,
            NotificationDeliveryStatus::Suppressed,
            NotificationDeliveryStatus::Cancelled,
        ],
        'queued' => [
            NotificationDeliveryStatus::Processing,
            NotificationDeliveryStatus::Suppressed,
            NotificationDeliveryStatus::Cancelled,
        ],
        'processing' => [
            NotificationDeliveryStatus::Delivered,
            NotificationDeliveryStatus::Failed,
            NotificationDeliveryStatus::Retrying,
            NotificationDeliveryStatus::Skipped,
            NotificationDeliveryStatus::Suppressed,
        ],
        'retrying' => [
            NotificationDeliveryStatus::Processing,
            NotificationDeliveryStatus::Failed,
            NotificationDeliveryStatus::Delivered,
        ],
        'failed' => [
            NotificationDeliveryStatus::Pending,
            NotificationDeliveryStatus::Queued,
            NotificationDeliveryStatus::Retrying,
            NotificationDeliveryStatus::Cancelled,
        ],
    ];

    public function transition(
        NotificationDelivery $delivery,
        NotificationDeliveryStatus $to,
        array $attributes = [],
    ): NotificationDelivery {
        $from = $delivery->status;

        if ($from === $to) {
            $delivery->fill($attributes);
            $delivery->save();

            return $delivery->fresh();
        }

        if (! $this->canTransition($from, $to)) {
            throw new InvalidArgumentException(
                "Invalid delivery transition {$from->value} → {$to->value} for delivery {$delivery->id}",
            );
        }

        $delivery->fill(array_merge($attributes, ['status' => $to]));
        $delivery->save();

        return $delivery->fresh();
    }

    public function canTransition(NotificationDeliveryStatus $from, NotificationDeliveryStatus $to): bool
    {
        if ($from->isTerminal() && $to !== NotificationDeliveryStatus::Queued && $to !== NotificationDeliveryStatus::Pending) {
            return in_array($to, [NotificationDeliveryStatus::Cancelled], true)
                || ($from === NotificationDeliveryStatus::Failed && in_array($to, [
                    NotificationDeliveryStatus::Pending,
                    NotificationDeliveryStatus::Queued,
                    NotificationDeliveryStatus::Retrying,
                ], true));
        }

        $allowed = self::TRANSITIONS[$from->value] ?? [];

        return in_array($to, $allowed, true);
    }

    public function markQueued(NotificationDelivery $delivery, ?string $correlationId = null): NotificationDelivery
    {
        return $this->transition($delivery, NotificationDeliveryStatus::Queued, array_filter([
            'correlation_id' => $correlationId ?? $delivery->correlation_id ?? (string) Str::uuid(),
        ]));
    }

    public function markProcessing(NotificationDelivery $delivery): NotificationDelivery
    {
        return $this->transition($delivery, NotificationDeliveryStatus::Processing, [
            'last_attempt_at' => now(),
            'attempts' => $delivery->attempts + 1,
        ]);
    }

    /**
     * Atomically claim a delivery for worker processing with a processing lease.
     */
    public function claimProcessing(
        NotificationDelivery $delivery,
        ?int $leaseSeconds = null,
    ): ?NotificationDelivery {
        $leaseSeconds ??= (int) config('diyar.notifications.worker.timeout', 120);
        $now = now();
        $token = (string) Str::uuid();
        $leaseUntil = $now->copy()->addSeconds(max(60, $leaseSeconds + 30));

        $claimableStatuses = [
            NotificationDeliveryStatus::Pending,
            NotificationDeliveryStatus::Queued,
            NotificationDeliveryStatus::Retrying,
            NotificationDeliveryStatus::Failed,
        ];

        $updated = NotificationDelivery::query()
            ->where('id', $delivery->id)
            ->where(function ($query) use ($claimableStatuses, $now) {
                $query->whereIn('status', $claimableStatuses)
                    ->orWhere(function ($expiredLease) use ($now) {
                        $expiredLease->where('status', NotificationDeliveryStatus::Processing)
                            ->where(function ($lease) use ($now) {
                                $lease->whereNull('processing_lease_until')
                                    ->orWhere('processing_lease_until', '<', $now);
                            });
                    });
            })
            ->update([
                'status' => NotificationDeliveryStatus::Processing,
                'last_attempt_at' => $now,
                'claimed_at' => $now,
                'processing_token' => $token,
                'processing_lease_until' => $leaseUntil,
                'attempts' => $delivery->attempts + 1,
            ]);

        if ($updated !== 1) {
            return null;
        }

        return $delivery->fresh();
    }

    public function markDelivered(NotificationDelivery $delivery, ?string $provider = null, ?string $providerMessageId = null): NotificationDelivery
    {
        return $this->transition($delivery, NotificationDeliveryStatus::Delivered, [
            'delivered_at' => now(),
            'failed_at' => null,
            'last_error' => null,
            'failure_code' => null,
            'failure_category' => null,
            'provider' => $provider,
            'provider_message_id' => $providerMessageId,
            'next_retry_at' => null,
        ]);
    }

    public function markSuppressed(NotificationDelivery $delivery, string $reason): NotificationDelivery
    {
        return $this->transition($delivery, NotificationDeliveryStatus::Suppressed, [
            'last_error' => $reason,
            'delivered_at' => now(),
        ]);
    }

    public function markSkipped(NotificationDelivery $delivery, string $reason): NotificationDelivery
    {
        return $this->transition($delivery, NotificationDeliveryStatus::Skipped, [
            'last_error' => $reason,
            'delivered_at' => now(),
        ]);
    }

    public function markRetrying(
        NotificationDelivery $delivery,
        string $error,
        NotificationFailureCategory $category,
        ?\DateTimeInterface $nextRetryAt,
    ): NotificationDelivery {
        return $this->transition($delivery, NotificationDeliveryStatus::Retrying, [
            'last_error' => $error,
            'failure_category' => $category->value,
            'next_retry_at' => $nextRetryAt,
        ]);
    }

    public function markFailed(
        NotificationDelivery $delivery,
        string $error,
        NotificationFailureCategory $category,
        ?string $failureCode = null,
        ?string $provider = null,
    ): NotificationDelivery {
        return $this->transition($delivery, NotificationDeliveryStatus::Failed, [
            'last_error' => $error,
            'failure_category' => $category->value,
            'failure_code' => $failureCode,
            'provider' => $provider,
            'failed_at' => now(),
            'next_retry_at' => null,
        ]);
    }
}
