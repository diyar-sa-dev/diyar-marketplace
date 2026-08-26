<?php

namespace App\Http\Resources;

use App\Models\ChatMessageReport;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ChatMessageReport */
class AdminChatMessageReportResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'message_id' => $this->message_id,
            'reporter_id' => $this->reporter_id,
            'reporter_name' => $this->reporter?->name,
            'reason' => $this->reason,
            'details' => $this->details,
            'status' => $this->status->value,
            'resolution_note' => $this->resolution_note,
            'action_taken' => $this->action_taken,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'reviewed_by' => $this->reviewed_by,
            'message' => $this->whenLoaded('message', fn () => $this->message !== null
                ? new AdminMessageResource($this->message)
                : null),
            'conversation' => $this->whenLoaded('conversation', fn () => $this->conversation !== null
                ? new AdminConversationResource($this->conversation)
                : null),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
