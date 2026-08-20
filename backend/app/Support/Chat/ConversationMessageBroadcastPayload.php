<?php

namespace App\Support\Chat;

use App\Models\Message;

final class ConversationMessageBroadcastPayload
{
    /**
     * @return array<string, mixed>
     */
    public static function fromMessage(Message $message): array
    {
        $message->loadMissing(['sender', 'attachments']);
        $isDeleted = $message->deleted_at !== null;

        return [
            'message_id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'sender_id' => $message->sender_id,
            'sender_name' => $message->sender?->name,
            'body' => $isDeleted ? null : $message->body,
            'message_type' => $message->message_type->value,
            'reply_to_message_id' => $message->reply_to_message_id,
            'edited_at' => $message->edited_at?->toIso8601String(),
            'deleted_at' => $message->deleted_at?->toIso8601String(),
            'is_deleted' => $isDeleted,
            'created_at' => $message->created_at?->toIso8601String(),
            'attachments' => $isDeleted
                ? []
                : $message->attachments->map(function ($attachment) use ($message) {
                    $path = '/profile/conversations/'.$message->conversation_id.'/attachments/'.$attachment->id;

                    return [
                        'id' => $attachment->id,
                        'original_name' => $attachment->original_name,
                        'mime_type' => $attachment->mime_type,
                        'size_bytes' => $attachment->size_bytes,
                        'url' => $path,
                        'preview_url' => $path.'?inline=1',
                    ];
                })->values()->all(),
        ];
    }
}
