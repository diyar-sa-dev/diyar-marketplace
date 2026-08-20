<?php

namespace App\Services\Chat;

use App\Models\ConversationParticipant;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

final class ChatPresenceService
{
    private function key(string $userId): string
    {
        return (string) config('diyar.chat.cache.prefix', 'diyar:chat:')."presence:{$userId}";
    }

    public function touch(User $user, string $conversationId): void
    {
        $ttl = (int) config('diyar.chat.presence.ttl_seconds', 120);

        Cache::put($this->key($user->id), [
            'conversation_id' => $conversationId,
            'last_seen_at' => now()->toIso8601String(),
        ], $ttl);
    }

    public function isViewingConversation(User $user, string $conversationId): bool
    {
        $state = Cache::get($this->key($user->id));

        if (! is_array($state)) {
            return false;
        }

        return ($state['conversation_id'] ?? null) === $conversationId;
    }

    public function isRecentlyActive(User $user): bool
    {
        return Cache::has($this->key($user->id));
    }

    public function shouldSuppressChatNotifications(User $user, string $conversationId): bool
    {
        if (! (bool) config('diyar.chat.presence.suppress_notifications_when_active', true)) {
            return false;
        }

        return $this->isViewingConversation($user, $conversationId);
    }

    public function hasReadConversation(User $user, string $conversationId): bool
    {
        $participant = ConversationParticipant::query()
            ->where('conversation_id', $conversationId)
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->first();

        return $participant !== null
            && (int) $participant->unread_count === 0
            && $participant->last_read_at !== null;
    }

    public function shouldSuppressExternalNotifications(User $user, string $conversationId): bool
    {
        return $this->shouldSuppressChatNotifications($user, $conversationId);
    }
}
