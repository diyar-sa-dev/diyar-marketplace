<?php

namespace App\Listeners\Chat;

use App\Events\Domain\MessageCreated;
use App\Services\Chat\ChatCacheService;
use Illuminate\Support\Facades\Log;

final class InvalidateChatCacheListener
{
    public function __construct(
        private readonly ChatCacheService $cache,
    ) {}

    public function handle(MessageCreated $event): void
    {
        try {
            $this->cache->invalidateForMessage($event->message);
        } catch (\Throwable $exception) {
            Log::warning('chat.redis.failed', [
                'action' => 'invalidate_message_cache',
                'message_id' => $event->message->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
