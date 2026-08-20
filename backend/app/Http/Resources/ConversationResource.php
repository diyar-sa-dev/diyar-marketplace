<?php

namespace App\Http\Resources;

use App\Models\Conversation;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Conversation */
class ConversationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $participant = $this->participants->firstWhere('user_id', $user?->id);
        /** @var MediaUploadService $media */
        $media = app(MediaUploadService::class);

        $otherParticipants = $this->participants
            ->where('user_id', '!=', $user?->id)
            ->values();

        return [
            'id' => $this->id,
            'created_by' => $this->created_by,
            'type' => $this->type->value,
            'subject' => $this->subject,
            'context_type' => $this->context_type,
            'context_id' => $this->context_id,
            'vendor_account_id' => $this->vendor_account_id,
            'provider_account_id' => $this->provider_account_id,
            'unread_count' => $participant?->unread_count ?? 0,
            'last_read_at' => $participant?->last_read_at?->toIso8601String(),
            'participants' => $this->participants->map(fn ($p) => [
                'id' => $p->id,
                'user_id' => $p->user_id,
                'name' => $p->user?->name,
                'avatar_url' => $media->url($p->user?->avatar_path),
                'participant_role' => $p->participant_role->value,
            ])->values(),
            'display_name' => $otherParticipants->first()?->user?->name ?? $this->subject,
            'vendor_slug' => $this->vendorAccount?->slug,
            'provider_slug' => $this->providerAccount?->slug,
            'last_message' => $this->lastMessage ? [
                'id' => $this->lastMessage->id,
                'body' => $this->lastMessage->body,
                'sender_id' => $this->lastMessage->sender_id,
                'message_type' => $this->lastMessage->message_type->value,
                'created_at' => $this->lastMessage->created_at?->toIso8601String(),
            ] : null,
            'last_message_at' => $this->last_message_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
