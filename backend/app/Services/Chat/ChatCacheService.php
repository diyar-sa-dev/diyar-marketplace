<?php

namespace App\Services\Chat;

use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use Illuminate\Support\Facades\Cache;

final class ChatCacheService
{
    private function prefix(): string
    {
        return (string) config('diyar.chat.cache.prefix', 'diyar:chat:');
    }

    public function conversationSummaryKey(string $conversationId): string
    {
        return $this->prefix()."conversation:{$conversationId}:summary";
    }

    public function forgetConversationSummary(string $conversationId): void
    {
        Cache::forget($this->conversationSummaryKey($conversationId));
    }

    /**
     * @return array<string, mixed>|null
     */
    public function conversationSummary(Conversation $conversation): ?array
    {
        $ttl = (int) config('diyar.chat.cache.summary_ttl', 120);

        return Cache::remember($this->conversationSummaryKey($conversation->id), $ttl, function () use ($conversation): array {
            $conversation->loadMissing(['lastMessage.sender']);

            return [
                'id' => $conversation->id,
                'last_message_at' => $conversation->last_message_at?->toIso8601String(),
                'last_message' => $conversation->lastMessage ? [
                    'id' => $conversation->lastMessage->id,
                    'body' => $conversation->lastMessage->body,
                    'sender_id' => $conversation->lastMessage->sender_id,
                    'created_at' => $conversation->lastMessage->created_at?->toIso8601String(),
                ] : null,
            ];
        });
    }

    public function invalidateForMessage(Message $message): void
    {
        $this->forgetConversationSummary($message->conversation_id);

        $userIds = ConversationParticipant::query()
            ->where('conversation_id', $message->conversation_id)
            ->whereNull('left_at')
            ->pluck('user_id');

        foreach ($userIds as $userId) {
            app(ChatUnreadCounterService::class)->forgetUserTotal((string) $userId);
        }
    }

    public function invalidateForRead(string $conversationId, string $userId): void
    {
        $this->forgetConversationSummary($conversationId);
        app(ChatUnreadCounterService::class)->forgetUserTotal($userId);
    }
}
