<?php

namespace App\Events\Broadcast;

use App\Models\UserNotification;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class UserNotificationCreated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public readonly UserNotification $notification,
        public readonly int $unreadCount,
    ) {}

    /**
     * @return list<PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('users.'.$this->notification->user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'notification.created';
    }

    public function broadcastQueue(): string
    {
        return (string) config('diyar.notifications.queues.high', 'notifications-high');
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'notification_id' => $this->notification->id,
            'type' => $this->notification->type->value,
            'title' => $this->notification->title,
            'body' => $this->notification->body,
            'data' => $this->notification->data ?? [],
            'entity_type' => $this->notification->entity_type,
            'entity_id' => $this->notification->entity_id,
            'created_at' => $this->notification->created_at?->toIso8601String(),
            'is_read' => $this->notification->read_at !== null,
            'unread_count' => $this->unreadCount,
        ];
    }
}
