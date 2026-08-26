<?php

namespace App\Http\Resources;

use App\Models\NotificationBroadcast;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin NotificationBroadcast */
class NotificationBroadcastResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'category' => $this->category,
            'channels' => $this->channels ?? [],
            'audience_type' => $this->audience_type->value,
            'audience_filter' => $this->audience_filter,
            'priority' => $this->priority->value,
            'status' => $this->status->value,
            'total_recipients' => $this->total_recipients,
            'processed_recipients' => $this->processed_recipients,
            'scheduled_at' => $this->scheduled_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'started_at' => $this->started_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'last_error' => $this->last_error,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
