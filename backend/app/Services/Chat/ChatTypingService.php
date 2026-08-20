<?php

namespace App\Services\Chat;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

final class ChatTypingService
{
    private function prefix(): string
    {
        return (string) config('diyar.chat.cache.prefix', 'diyar:chat:');
    }

    private function key(string $conversationId, string $userId): string
    {
        return $this->prefix()."typing:{$conversationId}:{$userId}";
    }

    private function broadcastKey(string $conversationId, string $userId): string
    {
        return $this->key($conversationId, $userId).':broadcast';
    }

    public function setTyping(string $conversationId, User $user, bool $typing): bool
    {
        $ttl = (int) config('diyar.chat.typing.ttl_seconds', 5);
        $debounceMs = (int) config('diyar.chat.typing.debounce_ms', 1500);

        if (! $typing) {
            Cache::forget($this->key($conversationId, $user->id));
            Cache::forget($this->broadcastKey($conversationId, $user->id));

            return true;
        }

        Cache::put($this->key($conversationId, $user->id), [
            'user_id' => $user->id,
            'name' => $user->name,
        ], $ttl);

        if (Cache::has($this->broadcastKey($conversationId, $user->id))) {
            return false;
        }

        Cache::put(
            $this->broadcastKey($conversationId, $user->id),
            true,
            now()->addMilliseconds($debounceMs),
        );

        return true;
    }
}
