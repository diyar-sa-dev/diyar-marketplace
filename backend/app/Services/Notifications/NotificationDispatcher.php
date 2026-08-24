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
use App\Support\Notifications\NotificationQueue;
use Illuminate\Database\QueryException;

final class NotificationDispatcher
{
    public function __construct(
        private readonly NotificationCatalog $catalog,
        private readonly NotificationRenderer $renderer,
        private readonly NotificationPreferenceResolver $preferences,
        private readonly NotificationRealtimeBroadcaster $realtime,
        private readonly ChatPresenceService $chatPresence,
    ) {}

    /**
     * @param  list<User>  $recipients
     * @param  array<string, mixed>  $payload
     */
    public function dispatch(
        NotificationType $type,
        array $recipients,
        array $payload,
        ?string $entityType = null,
        ?string $entityId = null,
        ?string $dedupeKey = null,
    ): void {
        foreach ($recipients as $recipient) {
            if (! $recipient instanceof User) {
                continue;
            }

            $this->dispatchToUser($type, $recipient, $payload, $entityType, $entityId, $dedupeKey);
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function dispatchToUser(
        NotificationType $type,
        User $recipient,
        array $payload,
        ?string $entityType,
        ?string $entityId,
        ?string $dedupeKey,
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
        $priority = $this->catalog->priorityFor($type);
        $channels = $this->catalog->channelsFor($type);
        $userDedupe = $dedupeKey !== null ? "{$dedupeKey}:{$recipient->id}" : null;

        [$notification, $wasCreated] = $this->persistInAppNotification(
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
            $this->realtime->notificationCreated($notification);
        }

        foreach ($channels as $channel) {
            if ($channel === NotificationChannel::InApp) {
                continue;
            }

            if (! $this->preferences->isChannelEnabled($recipient, $type, $channel)) {
                continue;
            }

            $deliveryDedupe = $this->deliveryDedupeKey($type, $recipient->id, $channel, $entityType, $entityId, $dedupeKey);

            try {
                $delivery = NotificationDelivery::query()->create([
                    'user_notification_id' => $notification->id,
                    'user_id' => $recipient->id,
                    'channel' => $channel,
                    'status' => NotificationDeliveryStatus::Pending,
                    'dedupe_key' => $deliveryDedupe,
                ]);

                DeliverNotificationChannelJob::dispatch($delivery->id, $payload)
                    ->onQueue(NotificationQueue::forPriority($priority));
            } catch (QueryException $exception) {
                if (! $this->isDuplicateKey($exception)) {
                    throw $exception;
                }
            }
        }
    }

    /**
     * @param  array{title: string, body: string}  $rendered
     * @param  array<string, mixed>  $payload
     * @param  list<NotificationChannel>  $channels
     */
    /**
     * @return array{0: ?UserNotification, 1: bool}
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
            return [null, false];
        }

        if (! $inAppEnabled) {
            // Still create a shell notification when other channels need a parent record.
            if (! array_intersect(
                [NotificationChannel::Email, NotificationChannel::Push],
                array_filter($channels, fn ($c) => $this->preferences->isChannelEnabled($recipient, $type, $c)),
            )) {
                return [null, false];
            }
        }

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
                ]),
                true,
            ];
        } catch (QueryException $exception) {
            if ($this->isDuplicateKey($exception) && $userDedupe !== null) {
                return [
                    UserNotification::query()
                        ->where('user_id', $recipient->id)
                        ->where('dedupe_key', $userDedupe)
                        ->first(),
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
