<?php

namespace App\Jobs\Notifications;

use App\Channels\Notifications\EmailNotificationChannel;
use App\Channels\Notifications\InAppChannel;
use App\Channels\Notifications\PushNotificationChannel;
use App\Channels\Notifications\SmsNotificationChannel;
use App\Enums\NotificationChannel;
use App\Enums\NotificationDeliveryStatus;
use App\Enums\NotificationFailureCategory;
use App\Enums\NotificationType;
use App\Models\NotificationDelivery;
use App\Models\User;
use App\Services\Chat\ChatPresenceService;
use App\Services\Notifications\NotificationCircuitBreaker;
use App\Services\Notifications\NotificationBroadcastProgressService;
use App\Services\Notifications\NotificationDeliveryStateMachine;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

final class DeliverNotificationChannelJob implements ShouldQueue, ShouldBeUnique
{
    use Queueable;

    public int $tries;

    /** @var list<int> */
    public array $backoff;

    public int $timeout;

    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public readonly string $deliveryId,
        public readonly array $payload = [],
    ) {
        $worker = config('diyar.notifications.worker', []);
        $this->tries = (int) ($worker['tries'] ?? 5);
        $this->backoff = is_array($worker['backoff'] ?? null) ? $worker['backoff'] : [30, 60, 120, 300, 600];
        $this->timeout = (int) ($worker['timeout'] ?? 120);
    }

    public function uniqueId(): string
    {
        return $this->deliveryId;
    }

    public function handle(
        InAppChannel $inApp,
        EmailNotificationChannel $email,
        PushNotificationChannel $push,
        SmsNotificationChannel $sms,
        NotificationDeliveryStateMachine $stateMachine,
        NotificationCircuitBreaker $circuitBreaker,
        NotificationBroadcastProgressService $broadcastProgress,
    ): void {
        $delivery = NotificationDelivery::query()->with(['notification', 'user'])->find($this->deliveryId);

        if ($delivery === null) {
            return;
        }

        if ($delivery->status->isTerminal()) {
            return;
        }

        $claimed = $stateMachine->claimProcessing($delivery, $this->timeout);

        if ($claimed === null) {
            return;
        }

        $delivery = $claimed;

        $recipient = $delivery->user;
        $notification = $delivery->notification;
        $broadcastId = $this->resolveBroadcastId(
            is_array($notification?->data) ? $notification->data : null,
            $this->payload,
        );

        if (! $recipient instanceof User || $notification === null) {
            $stateMachine->markFailed(
                $delivery,
                'Missing recipient or notification.',
                NotificationFailureCategory::Permanent,
            );

            return;
        }

        if ($notification->type === NotificationType::ChatMessageReceived) {
            $conversationId = is_string($notification->data['conversation_id'] ?? null)
                ? $notification->data['conversation_id']
                : (is_string($this->payload['conversation_id'] ?? null) ? $this->payload['conversation_id'] : null);

            $presence = app(ChatPresenceService::class);

            if ($conversationId !== null && (
                $presence->shouldSuppressChatNotifications($recipient, $conversationId)
                || $presence->hasReadConversation($recipient, $conversationId)
            )) {
                $stateMachine->markSkipped($delivery, 'Chat notification suppressed by presence/read state.');
                $broadcastProgress->recordDeliveryOutcome($broadcastId, NotificationDeliveryStatus::Skipped);

                return;
            }
        }

        $providerKey = $delivery->channel->value;

        $channel = match ($delivery->channel) {
            NotificationChannel::InApp => $inApp,
            NotificationChannel::Email => $email,
            NotificationChannel::Push => $push,
            NotificationChannel::Sms => $sms,
        };

        try {
            $channel->deliver($recipient, $notification, $delivery, $this->payload);
            $stateMachine->markDelivered($delivery, provider: $providerKey);
            $broadcastProgress->recordDeliveryOutcome($broadcastId, NotificationDeliveryStatus::Delivered);
            $circuitBreaker->recordSuccess($providerKey);
        } catch (Throwable $exception) {
            $category = $circuitBreaker->classifyFailure($exception);
            $attemptNumber = $delivery->attempts;
            $isLastAttempt = $attemptNumber >= $this->tries;

            if ($category !== NotificationFailureCategory::CircuitOpen) {
                $circuitBreaker->recordFailure($providerKey);
            }

            Log::warning('notifications.delivery.failed', [
                'delivery_id' => $delivery->id,
                'channel' => $delivery->channel->value,
                'attempt' => $attemptNumber,
                'failure_category' => $category->value,
                'error' => $exception->getMessage(),
                'correlation_id' => $delivery->correlation_id,
            ]);

            if ($category === NotificationFailureCategory::CircuitOpen) {
                $cooldown = (int) config('diyar.notifications.circuit_breaker.cooldown_seconds', 120);
                $stateMachine->markRetrying(
                    $delivery,
                    $exception->getMessage(),
                    $category,
                    now()->addSeconds($cooldown),
                );
                $this->release($cooldown);

                return;
            }

            if (! $category->isRetryable() || $isLastAttempt) {
                $stateMachine->markFailed(
                    $delivery,
                    $exception->getMessage(),
                    $category,
                    provider: $providerKey,
                );
                $broadcastProgress->recordDeliveryOutcome($broadcastId, NotificationDeliveryStatus::Failed);
                $this->fail($exception);

                return;
            }

            $backoffIndex = max(0, min($attemptNumber - 1, count($this->backoff) - 1));
            $delaySeconds = $this->backoff[$backoffIndex] ?? 60;

            $stateMachine->markRetrying(
                $delivery,
                $exception->getMessage(),
                $category,
                now()->addSeconds($delaySeconds),
            );

            throw $exception;
        }
    }

    public function failed(Throwable $exception): void
    {
        $delivery = NotificationDelivery::query()->find($this->deliveryId);

        if ($delivery === null || $delivery->status->isTerminal()) {
            return;
        }

        app(NotificationDeliveryStateMachine::class)->markFailed(
            $delivery,
            $exception->getMessage(),
            NotificationFailureCategory::Transient,
        );

        $notification = $delivery->notification;
        $broadcastId = $this->resolveBroadcastId(
            is_array($notification?->data) ? $notification->data : null,
            $this->payload,
        );
        app(NotificationBroadcastProgressService::class)
            ->recordDeliveryOutcome($broadcastId, NotificationDeliveryStatus::Failed);
    }

    /**
     * @param  array<string, mixed>|null  $notificationData
     * @param  array<string, mixed>  $payload
     */
    private function resolveBroadcastId(?array $notificationData, array $payload): ?string
    {
        $fromPayload = $payload['broadcast_id'] ?? null;
        if (is_string($fromPayload) && $fromPayload !== '') {
            return $fromPayload;
        }

        $fromNotification = $notificationData['broadcast_id'] ?? null;

        return is_string($fromNotification) && $fromNotification !== '' ? $fromNotification : null;
    }
}
