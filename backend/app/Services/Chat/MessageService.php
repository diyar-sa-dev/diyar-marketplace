<?php

namespace App\Services\Chat;

use App\Enums\MessageType;
use App\Events\Domain\MessageCreated;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

final class MessageService
{
    public function __construct(
        private readonly ChatAuthorizationService $authorization,
        private readonly ChatAttachmentService $attachments,
        private readonly ChatDeliveryService $delivery,
        private readonly ChatRealtimeBroadcaster $realtime,
    ) {}

    /**
     * @return array{items: list<Message>, next_cursor: string|null}
     */
    public function listMessages(User $user, Conversation $conversation, ?string $cursor, int $limit = 30): array
    {
        $this->authorization->ensureParticipant($user, $conversation);
        $this->delivery->markDelivered($user, $conversation);

        $query = Message::query()
            ->where('conversation_id', $conversation->id)
            ->whereNull('archived_at')
            ->with(['sender', 'attachments'])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($cursor !== null && $cursor !== '') {
            [$createdAt, $id] = $this->decodeCursor($cursor);
            $query->where(function ($q) use ($createdAt, $id) {
                $q->where('created_at', '<', $createdAt)
                    ->orWhere(function ($inner) use ($createdAt, $id) {
                        $inner->where('created_at', '=', $createdAt)
                            ->where('id', '<', $id);
                    });
            });
        }

        $messages = $query->limit($limit + 1)->get();
        $hasMore = $messages->count() > $limit;
        $items = $messages->take($limit)->values()->all();
        $items = array_reverse($items);

        $nextCursor = null;
        if ($hasMore && count($items) > 0) {
            $oldest = $items[0];
            if ($oldest instanceof Message) {
                $nextCursor = $this->encodeCursor($oldest);
            }
        }

        return [
            'items' => $items,
            'next_cursor' => $nextCursor,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function send(User $sender, Conversation $conversation, array $payload, ?UploadedFile $file = null): Message
    {
        $this->authorization->ensureParticipant($sender, $conversation);

        $body = trim((string) ($payload['body'] ?? ''));
        $idempotencyKey = isset($payload['idempotency_key']) ? trim((string) $payload['idempotency_key']) : null;
        $replyToMessageId = isset($payload['reply_to_message_id']) ? trim((string) $payload['reply_to_message_id']) : null;

        if ($body === '' && $file === null) {
            throw new InvalidArgumentException(__('diyar.chat.message_required'));
        }

        $startedAt = microtime(true);

        try {
            $message = DB::transaction(function () use ($sender, $conversation, $body, $idempotencyKey, $replyToMessageId, $file) {
                if ($idempotencyKey !== null && $idempotencyKey !== '') {
                    $existing = Message::query()
                        ->where('conversation_id', $conversation->id)
                        ->where('idempotency_key', $idempotencyKey)
                        ->lockForUpdate()
                        ->with(['sender', 'attachments'])
                        ->first();

                    if ($existing !== null) {
                        return $existing;
                    }
                }

                if ($replyToMessageId !== null && $replyToMessageId !== '') {
                    $replyExists = Message::query()
                        ->where('conversation_id', $conversation->id)
                        ->where('id', $replyToMessageId)
                        ->whereNull('archived_at')
                        ->whereNull('deleted_at')
                        ->exists();

                    if (! $replyExists) {
                        throw new InvalidArgumentException(__('diyar.chat.message_not_found'));
                    }
                }

                $messageType = $file !== null ? MessageType::Attachment : MessageType::Text;

                $message = Message::query()->create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $sender->id,
                    'body' => $body !== '' ? $body : null,
                    'message_type' => $messageType,
                    'idempotency_key' => $idempotencyKey,
                    'reply_to_message_id' => $replyToMessageId ?: null,
                ]);

                if ($file !== null) {
                    $this->attachments->attachToMessage($message, $file);
                }

                $conversation->update([
                    'last_message_id' => $message->id,
                    'last_message_at' => $message->created_at,
                ]);

                ConversationParticipant::query()
                    ->where('conversation_id', $conversation->id)
                    ->whereNull('left_at')
                    ->where('user_id', '!=', $sender->id)
                    ->update([
                        'unread_count' => DB::raw('unread_count + 1'),
                        'inbox_hidden_at' => null,
                    ]);

                $message->load(['sender', 'attachments']);

                DB::afterCommit(function () use ($message): void {
                    event(new MessageCreated($message));
                });

                return $message;
            });
        } catch (QueryException $exception) {
            if ($idempotencyKey !== null && $this->isDuplicateIdempotencyKey($exception)) {
                $existing = Message::query()
                    ->where('conversation_id', $conversation->id)
                    ->where('idempotency_key', $idempotencyKey)
                    ->with(['sender', 'attachments'])
                    ->first();

                if ($existing !== null) {
                    return $existing;
                }
            }

            Log::warning('chat.message.failed', [
                'conversation_id' => $conversation->id,
                'sender_id' => $sender->id,
                'error' => $exception->getMessage(),
            ]);

            throw $exception;
        }

        ChatMetrics::info('chat.message.created', [
            'message_id' => $message->id,
            'conversation_id' => $conversation->id,
            'sender_id' => $sender->id,
            'persistence_ms' => ChatMetrics::durationMs($startedAt),
        ]);

        return $message;
    }

    public function update(User $user, Conversation $conversation, Message $message, string $body): Message
    {
        $this->authorization->ensureParticipant($user, $conversation);

        if ($message->conversation_id !== $conversation->id) {
            throw new InvalidArgumentException(__('diyar.chat.message_not_found'));
        }

        if ($message->sender_id !== $user->id || $message->deleted_at !== null) {
            throw new InvalidArgumentException(__('diyar.chat.cannot_edit_message'));
        }

        if ($message->message_type === MessageType::Attachment && $message->attachments()->exists() && trim($body) === '') {
            throw new InvalidArgumentException(__('diyar.chat.message_required'));
        }

        $message->update([
            'body' => trim($body),
            'edited_at' => now(),
        ]);

        $message = $message->fresh(['sender', 'attachments']);
        $this->realtime->messageUpdated($message);

        return $message;
    }

    public function delete(User $user, Conversation $conversation, Message $message): Message
    {
        $this->authorization->ensureParticipant($user, $conversation);

        if ($message->conversation_id !== $conversation->id) {
            throw new InvalidArgumentException(__('diyar.chat.message_not_found'));
        }

        if ($message->sender_id !== $user->id || $message->deleted_at !== null) {
            throw new InvalidArgumentException(__('diyar.chat.cannot_delete_message'));
        }

        $message->update([
            'body' => null,
            'deleted_at' => now(),
        ]);

        $message = $message->fresh(['sender', 'attachments']);
        $this->realtime->messageUpdated($message);

        return $message;
    }

    private function isDuplicateIdempotencyKey(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'idempotency_key') || str_contains($message, 'unique');
    }

    private function encodeCursor(Message $message): string
    {
        $createdAt = $message->created_at?->format('Y-m-d H:i:s.u') ?? '';

        return base64_encode($createdAt.'|'.$message->id);
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function decodeCursor(string $cursor): array
    {
        $decoded = base64_decode($cursor, true);
        if ($decoded === false || ! str_contains($decoded, '|')) {
            throw new InvalidArgumentException(__('diyar.chat.invalid_cursor'));
        }

        [$createdAt, $id] = explode('|', $decoded, 2);

        return [$createdAt, $id];
    }
}
