<?php

namespace App\Jobs\Notifications;

use App\Channels\Notifications\EmailNotificationChannel;
use App\Channels\Notifications\InAppChannel;
use App\Channels\Notifications\PushNotificationChannel;
use App\Enums\NotificationChannel;
use App\Enums\NotificationDeliveryStatus;
use App\Enums\NotificationType;
use App\Infrastructure\Notifications\PushProviderException;
use App\Models\NotificationDelivery;
use App\Models\User;
use App\Services\Chat\ChatPresenceService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

final class DeliverNotificationChannelJob implements ShouldQueue
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

    public function handle(
        InAppChannel $inApp,
        EmailNotificationChannel $email,
        PushNotificationChannel $push,
    ): void {
        $delivery = NotificationDelivery::query()->with(['notification', 'user'])->find($this->deliveryId);

        if ($delivery === null) {
            return;
        }

        if ($delivery->status === NotificationDeliveryStatus::Delivered) {
            return;
        }

        $recipient = $delivery->user;
        $notification = $delivery->notification;

        if (! $recipient instanceof User || $notification === null) {
            $delivery->update([
                'status' => NotificationDeliveryStatus::Failed,
                'last_error' => 'Missing recipient or notification.',
            ]);

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
                $delivery->update([
                    'status' => NotificationDeliveryStatus::Skipped,
                    'delivered_at' => now(),
                    'attempts' => $delivery->attempts + 1,
                    'last_error' => null,
                ]);

                return;
            }
        }

        $channel = match ($delivery->channel) {
            NotificationChannel::InApp => $inApp,
            NotificationChannel::Email => $email,
            NotificationChannel::Push => $push,
        };

        try {
            $channel->deliver($recipient, $notification, $delivery, $this->payload);
            $delivery->update([
                'status' => NotificationDeliveryStatus::Delivered,
                'delivered_at' => now(),
                'attempts' => $delivery->attempts + 1,
                'last_error' => null,
            ]);
        } catch (Throwable $exception) {
            $delivery->update([
                'status' => NotificationDeliveryStatus::Failed,
                'attempts' => $delivery->attempts + 1,
                'last_error' => $exception->getMessage(),
            ]);

            Log::warning('notifications.delivery.failed', [
                'delivery_id' => $delivery->id,
                'channel' => $delivery->channel->value,
                'error' => $exception->getMessage(),
            ]);

            if ($this->isPermanentFailure($exception)) {
                $this->fail($exception);

                return;
            }

            throw $exception;
        }
    }

    private function isPermanentFailure(Throwable $exception): bool
    {
        if ($exception instanceof PushProviderException && $exception->permanent) {
            return true;
        }

        $message = strtolower($exception->getMessage());

        return str_contains($message, 'no email')
            || str_contains($message, 'email notifications are disabled')
            || str_contains($message, 'no active push')
            || str_contains($message, 'not configured')
            || str_contains($message, 'credentials');
    }
}
