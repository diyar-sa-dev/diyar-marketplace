<?php

namespace App\Events\Broadcast;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

final class ConversationTypingUpdated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;

    public function __construct(
        public readonly string $conversationId,
        public readonly string $userId,
        public readonly string $name,
        public readonly bool $typing,
    ) {}

    /**
     * @return list<PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversations.'.$this->conversationId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'typing.updated';
    }

    public function broadcastQueue(): string
    {
        return (string) config('diyar.chat.queues.typing', 'chat-low');
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'user_id' => $this->userId,
            'name' => $this->name,
            'typing' => $this->typing,
        ];
    }
}
