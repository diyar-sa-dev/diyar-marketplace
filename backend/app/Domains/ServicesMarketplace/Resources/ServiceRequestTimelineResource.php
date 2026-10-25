<?php

namespace App\Domains\ServicesMarketplace\Resources;

use App\Models\ServiceRequestTimeline;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ServiceRequestTimeline */
class ServiceRequestTimelineResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'actor_type' => $this->actor_type,
            'title' => $this->title,
            'notes' => $this->notes,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
