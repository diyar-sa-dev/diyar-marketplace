<?php

namespace App\Events\Broadcast;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class UserNotificationReadStateChanged implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public readonly string $userId,
        public readonly int $unreadCount,
        public readonly string $action,
        public readonly ?string $notificationId = null,
    ) {}

    /**
     * @return list<PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('users.'.$this->userId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'notification.read_state';
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
            'unread_count' => $this->unreadCount,
            'action' => $this->action,
            'notification_id' => $this->notificationId,
        ];
    }
}
