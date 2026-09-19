<?php

namespace App\Http\Resources;

use App\Models\RoomDesign;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin RoomDesign */
class RoomDesignListItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $preset = is_array($this->document) ? ($this->document['room']['preset_id'] ?? null) : null;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'preset_id' => $preset,
            'item_count' => $this->item_count,
            'version' => $this->version,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
