<?php

namespace App\Http\Resources;

use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin UserNotification */
class UserNotificationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'title' => $this->title,
            'body' => $this->body,
            'data' => $this->data ?? [],
            'entity_type' => $this->entity_type,
            'entity_id' => $this->entity_id,
            'priority' => $this->priority->value,
            'read_at' => $this->read_at?->toIso8601String(),
            'is_read' => $this->isRead(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
