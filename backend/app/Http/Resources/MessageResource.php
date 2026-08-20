<?php

namespace App\Http\Resources;

use App\Models\Message;
use App\Models\MessageAttachment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Message */
class MessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $isDeleted = $this->deleted_at !== null;

        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender_id' => $this->sender_id,
            'sender_name' => $this->sender?->name,
            'body' => $isDeleted ? null : $this->body,
            'message_type' => $this->message_type->value,
            'idempotency_key' => $this->idempotency_key,
            'reply_to_message_id' => $this->reply_to_message_id,
            'edited_at' => $this->edited_at?->toIso8601String(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'is_deleted' => $isDeleted,
            'attachments' => $isDeleted
                ? []
                : $this->attachments->map(fn ($attachment) => $this->attachmentPayload($attachment))->values(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function attachmentPayload(MessageAttachment $attachment): array
    {
        $path = '/profile/conversations/'.$this->conversation_id.'/attachments/'.$attachment->id;

        return [
            'id' => $attachment->id,
            'original_name' => $attachment->original_name,
            'mime_type' => $attachment->mime_type,
            'size_bytes' => $attachment->size_bytes,
            'url' => $path,
            'preview_url' => $path.'?inline=1',
        ];
    }
}
