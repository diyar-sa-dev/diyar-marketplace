<?php

namespace App\Http\Resources;

use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Conversation */
class AdminConversationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'subject' => $this->subject,
            'context_type' => $this->context_type,
            'context_id' => $this->context_id,
            'lifecycle_status' => $this->lifecycle_status->value,
            'vendor_account_id' => $this->vendor_account_id,
            'provider_account_id' => $this->provider_account_id,
            'created_by' => $this->created_by,
            'participants' => $this->participants->map(fn ($participant) => [
                'id' => $participant->id,
                'user_id' => $participant->user_id,
                'name' => $participant->user?->name,
                'email' => $participant->user?->email,
                'participant_role' => $participant->participant_role->value,
                'joined_at' => $participant->joined_at?->toIso8601String(),
                'left_at' => $participant->left_at?->toIso8601String(),
            ])->values(),
            'last_message' => $this->lastMessage ? [
                'id' => $this->lastMessage->id,
                'body' => $this->lastMessage->deleted_at !== null ? null : $this->lastMessage->body,
                'sender_id' => $this->lastMessage->sender_id,
                'message_type' => $this->lastMessage->message_type->value,
                'is_deleted' => $this->lastMessage->deleted_at !== null,
                'deleted_at' => $this->lastMessage->deleted_at?->toIso8601String(),
                'created_at' => $this->lastMessage->created_at?->toIso8601String(),
            ] : null,
            'last_message_at' => $this->last_message_at?->toIso8601String(),
            'pending_reports_count' => (int) ($this->pending_reports_count ?? 0),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
