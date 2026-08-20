<?php

namespace App\Services\Chat;

use App\Events\Broadcast\ConversationMessageCreated;
use App\Events\Broadcast\ConversationMessageUpdated;
use App\Events\Broadcast\ConversationTypingUpdated;
use App\Models\Message;
use Illuminate\Support\Facades\Log;

final class ChatRealtimeBroadcaster
{
    public function messageCreated(Message $message): void
    {
        if (! config('diyar.chat.realtime_enabled')) {
            return;
        }

        if (config('broadcasting.default') === 'null') {
            return;
        }

        try {
            $startedAt = microtime(true);
            broadcast(new ConversationMessageCreated($message))->toOthers();
            ChatMetrics::info('chat.broadcast.sent', [
                'message_id' => $message->id,
                'conversation_id' => $message->conversation_id,
                'broadcast_ms' => ChatMetrics::durationMs($startedAt),
            ]);
        } catch (\Throwable $exception) {
            ChatMetrics::warning('chat.broadcast.failed', [
                'message_id' => $message->id,
                'conversation_id' => $message->conversation_id,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    public function messageUpdated(Message $message): void
    {
        if (! config('diyar.chat.realtime_enabled')) {
            return;
        }

        if (config('broadcasting.default') === 'null') {
            return;
        }

        try {
            $startedAt = microtime(true);
            broadcast(new ConversationMessageUpdated($message))->toOthers();
            ChatMetrics::info('chat.broadcast.updated', [
                'message_id' => $message->id,
                'conversation_id' => $message->conversation_id,
                'broadcast_ms' => ChatMetrics::durationMs($startedAt),
            ]);
        } catch (\Throwable $exception) {
            ChatMetrics::warning('chat.broadcast.update_failed', [
                'message_id' => $message->id,
                'conversation_id' => $message->conversation_id,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    public function typing(string $conversationId, string $userId, string $name, bool $typing): void
    {
        if (! config('diyar.chat.realtime_enabled') || config('broadcasting.default') === 'null') {
            return;
        }

        try {
            broadcast(new ConversationTypingUpdated(
                $conversationId,
                $userId,
                $name,
                $typing,
            ))->toOthers();
        } catch (\Throwable $exception) {
            Log::warning('chat.websocket.typing_failed', [
                'conversation_id' => $conversationId,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
