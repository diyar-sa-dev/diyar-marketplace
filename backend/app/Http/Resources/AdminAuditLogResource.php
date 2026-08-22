<?php

namespace App\Http\Resources;

use App\Models\AdminAuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AdminAuditLog */
class AdminAuditLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action,
            'resource_type' => $this->resource_type,
            'resource_id' => $this->resource_id,
            'actor_role' => $this->actor_role,
            'before' => $this->before,
            'after' => $this->after,
            'reason' => $this->reason,
            'ip_address' => $this->ip_address,
            'created_at' => $this->created_at?->toIso8601String(),
            'actor' => $this->whenLoaded('actor', fn () => [
                'id' => $this->actor?->id,
                'name' => $this->actor?->name,
                'email' => $this->actor?->email,
            ]),
        ];
    }
}
