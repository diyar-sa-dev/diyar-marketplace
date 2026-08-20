<?php

namespace App\Services\Chat;

use App\Models\ConversationParticipant;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

final class ChatUnreadCounterService
{
    private function prefix(): string
    {
        return (string) config('diyar.chat.cache.prefix', 'diyar:chat:');
    }

    public function userTotalKey(string $userId): string
    {
        return $this->prefix()."user:{$userId}:unread_total";
    }

    public function totalForUser(User $user): int
    {
        $key = $this->userTotalKey($user->id);
        $ttl = (int) config('diyar.chat.cache.unread_ttl', 300);

        return (int) Cache::remember($key, $ttl, function () use ($user): int {
            return (int) ConversationParticipant::query()
                ->where('user_id', $user->id)
                ->whereNull('left_at')
                ->sum('unread_count');
        });
    }

    public function forgetUserTotal(string $userId): void
    {
        Cache::forget($this->userTotalKey($userId));
    }

    public function reconcileUser(string $userId): int
    {
        $this->forgetUserTotal($userId);

        return User::query()->where('id', $userId)->exists()
            ? $this->totalForUser(User::query()->findOrFail($userId))
            : 0;
    }

    public function incrementForParticipants(string $conversationId, string $exceptUserId): void
    {
        $userIds = ConversationParticipant::query()
            ->where('conversation_id', $conversationId)
            ->whereNull('left_at')
            ->where('user_id', '!=', $exceptUserId)
            ->pluck('user_id');

        foreach ($userIds as $userId) {
            $this->forgetUserTotal((string) $userId);
        }
    }
}
