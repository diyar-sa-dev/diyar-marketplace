<?php

namespace App\Services\Notifications;

use App\Enums\NotificationChannel;
use App\Enums\NotificationDeliveryStatus;
use App\Enums\NotificationPriority;
use App\Enums\NotificationType;
use App\Jobs\Notifications\DeliverNotificationChannelJob;
use App\Models\NotificationDelivery;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\Chat\ChatPresenceService;
use App\Services\Outbox\DomainOutboxPublisher;
use App\Support\Notifications\NotificationQueue;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class NotificationDispatcher
{
    public function __construct(
        private readonly NotificationCatalog $catalog,
        private readonly NotificationRenderer $renderer,
        private readonly NotificationPreferenceResolver $preferences,
        private readonly NotificationRealtimeBroadcaster $realtime,
        private readonly ChatPresenceService $chatPresence,
        private readonly NotificationDeliveryStateMachine $deliveryStateMachine,
        private readonly NotificationAggregationService $aggregation,
        private readonly NotificationUnreadCounterService $unreadCounter,
        private readonly DomainOutboxPublisher $outboxPublisher,
    ) {}

    /**
     * @param  list<User>  $recipients
     * @param  array<string, mixed>  $payload
     * @param  list<string>|null  $channelsOverride  Channel values e.g. ['in_app', 'email']
     */
    public function dispatch(
        NotificationType $type,
        array $recipients,
        array $payload,
        ?string $entityType = null,
        ?string $entityId = null,
        ?string $dedupeKey = null,
        ?array $channelsOverride = null,
        ?NotificationPriority $priorityOverride = null,
    ): void {
        foreach ($recipients as $recipient) {
            if (! $recipient instanceof User) {
                continue;
            }

            $this->dispatchToUser(
                $type,
                $recipient,
                $payload,
                $entityType,
                $entityId,
                $dedupeKey,
                $channelsOverride,
                $priorityOverride,
            );
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<string>|null  $channelsOverride
     */
    private function dispatchToUser(
        NotificationType $type,
        User $recipient,
        array $payload,
        ?string $entityType,
        ?string $entityId,
        ?string $dedupeKey,
        ?array $channelsOverride,
        ?NotificationPriority $priorityOverride,
    ): void {
        if ($type === NotificationType::ChatMessageReceived) {
            $conversationId = is_string($payload['conversation_id'] ?? null)
                ? $payload['conversation_id']
                : $entityId;

            if (
                is_string($conversationId)
                && $this->chatPresence->shouldSuppressChatNotifications($recipient, $conversationId)
            ) {
                return;
            }
        }

        $rendered = $this->renderer->render($recipient, $type, $payload);
        $priority = $priorityOverride ?? $this->catalog->priorityFor($type);
        $channels = $this->resolveChannels($type, $channelsOverride);
        $userDedupe = $dedupeKey !== null ? "{$dedupeKey}:{$recipient->id}" : null;

        [$notification, $wasCreated, $wasAggregated] = $this->persistInAppNotification(
            $recipient,
            $type,
            $rendered,
            $payload,
            $entityType,
            $entityId,
            $priority,
            $userDedupe,
            $channels,
        );

        if ($wasCreated) {
            app(NotificationService::class)->forgetUnreadCountCache($recipient->id);
        }

        if ($notification === null) {
            return;
        }

        if ($wasCreated) {
            $this->unreadCounter->increment($recipient);
            $this->realtime->notificationCreated($notification);
        } elseif ($wasAggregated) {
            $this->realtime->notificationCreated($notification);
        }

        foreach ($channels as $channel) {
            if ($channel === NotificationChannel::InApp) {
                continue;
            }

            if ($wasAggregated && NotificationDelivery::query()
                ->where('user_notification_id', $notification->id)
                ->where('channel', $channel)
                ->exists()) {
                continue;
            }

            $deliveryDedupe = $this->deliveryDedupeKey($type, $recipient->id, $channel, $entityType, $entityId, $dedupeKey);
            $correlationId = (string) Str::uuid();

            if (! $this->preferences->isChannelEnabled($recipient, $type, $channel)) {
                $this->recordSuppressedDelivery($notification, $recipient, $channel, $deliveryDedupe, $correlationId);

                continue;
            }

            try {
                DB::transaction(function () use ($notification, $recipient, $channel, $deliveryDedupe, $correlationId, $payload, $priority): void {
                    $delivery = NotificationDelivery::query()->create([
                        'user_notification_id' => $notification->id,
                        'user_id' => $recipient->id,
                        'channel' => $channel,
                        'status' => NotificationDeliveryStatus::Queued,
                        'dedupe_key' => $deliveryDedupe,
                        'correlation_id' => $correlationId,
                    ]);

                    if ((bool) config('diyar.outbox.enabled', true)) {
                        $this->outboxPublisher->publish(
                            eventType: 'notification.delivery.dispatch',
                            aggregateType: 'notification_delivery',
                            aggregateId: $delivery->id,
                            payload: [
                                'delivery_id' => $delivery->id,
                                'payload' => $payload,
                                'priority' => $priority->value,
                            ],
                            idempotencyKey: 'outbox:'.$deliveryDedupe,
                            correlationId: $correlationId,
                        );

                        return;
                    }

                    DeliverNotificationChannelJob::dispatch($delivery->id, $payload)
                        ->afterCommit()
                        ->onQueue(NotificationQueue::forPriority($priority));
                });
            } catch (QueryException $exception) {
                if (! $this->isDuplicateKey($exception)) {
                    throw $exception;
                }
            }
        }
    }

    /**
     * @param  list<string>|null  $channelsOverride
     * @return list<NotificationChannel>
     */
    private function resolveChannels(NotificationType $type, ?array $channelsOverride): array
    {
        if ($channelsOverride === null || $channelsOverride === []) {
            return $this->catalog->channelsFor($type);
        }

        return array_values(array_filter(array_map(
            fn (string $value) => NotificationChannel::tryFrom($value),
            $channelsOverride,
        )));
    }

    private function recordSuppressedDelivery(
        UserNotification $notification,
        User $recipient,
        NotificationChannel $channel,
        string $deliveryDedupe,
        string $correlationId,
    ): void {
        try {
            $delivery = NotificationDelivery::query()->create([
                'user_notification_id' => $notification->id,
                'user_id' => $recipient->id,
                'channel' => $channel,
                'status' => NotificationDeliveryStatus::Pending,
                'dedupe_key' => $deliveryDedupe,
                'correlation_id' => $correlationId,
            ]);

            $this->deliveryStateMachine->markSuppressed(
                $delivery,
                'Channel disabled by user preference or system policy.',
            );
        } catch (QueryException $exception) {
            if (! $this->isDuplicateKey($exception)) {
                throw $exception;
            }
        }
    }

    /**
     * @param  array{title: string, body: string}  $rendered
     * @param  array<string, mixed>  $payload
     * @param  list<NotificationChannel>  $channels
     * @return array{0: ?UserNotification, 1: bool, 2: bool}
     */
    private function persistInAppNotification(
        User $recipient,
        NotificationType $type,
        array $rendered,
        array $payload,
        ?string $entityType,
        ?string $entityId,
        NotificationPriority $priority,
        ?string $userDedupe,
        array $channels,
    ): array {
        $inAppEnabled = $this->preferences->isChannelEnabled($recipient, $type, NotificationChannel::InApp);

        if (! $inAppEnabled && ! in_array(NotificationChannel::InApp, $channels, true)) {
            return [null, false, false];
        }

        if (! $inAppEnabled) {
            if (! array_intersect(
                [NotificationChannel::Email, NotificationChannel::Push, NotificationChannel::Sms],
                array_filter($channels, fn ($c) => $this->preferences->isChannelEnabled($recipient, $type, $c)),
            )) {
                return [null, false, false];
            }
        }

        [$aggregated] = $this->aggregation->aggregateExisting(
            $recipient,
            $type,
            $payload,
            $entityType,
            $entityId,
            $rendered['title'],
            $rendered['body'],
        );

        if ($aggregated instanceof UserNotification) {
            return [$aggregated, false, true];
        }

        $groupKey = $this->aggregation->groupKey($type, $entityType, $entityId);
        $actorName = trim((string) ($payload['actor_name'] ?? $payload['reviewer_name'] ?? ''));
        $actors = $actorName !== '' ? [$actorName] : [];

        try {
            return [
                UserNotification::query()->create([
                    'user_id' => $recipient->id,
                    'type' => $type,
                    'title' => $rendered['title'],
                    'body' => $rendered['body'],
                    'data' => $payload,
                    'entity_type' => $entityType,
                    'entity_id' => $entityId,
                    'priority' => $priority,
                    'dedupe_key' => $userDedupe,
                    'group_key' => $groupKey,
                    'aggregated_count' => 1,
                    'actor_snapshot' => $actors !== [] ? $actors : null,
                ]),
                true,
                false,
            ];
        } catch (QueryException $exception) {
            if ($this->isDuplicateKey($exception) && $userDedupe !== null) {
                return [
                    UserNotification::query()
                        ->where('user_id', $recipient->id)
                        ->where('dedupe_key', $userDedupe)
                        ->first(),
                    false,
                    false,
                ];
            }

            throw $exception;
        }
    }

    private function deliveryDedupeKey(
        NotificationType $type,
        string $userId,
        NotificationChannel $channel,
        ?string $entityType,
        ?string $entityId,
        ?string $dedupeKey,
    ): string {
        $base = $dedupeKey ?? implode(':', array_filter([
            $type->value,
            $entityType,
            $entityId,
            $userId,
        ]));

        return "{$base}:{$channel->value}";
    }

    private function isDuplicateKey(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'unique') || str_contains($message, 'duplicate');
    }
}
