<?php

namespace App\Http\Resources;

use App\Models\TryInRoomJob;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TryInRoomJob */
class TryInRoomJobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'product_id' => $this->product_id,
            'room_design_id' => $this->room_design_id,
            'error_code' => $this->error_code,
            'result' => $this->when(
                $this->status->value === 'completed',
                $this->result,
            ),
            'result_url' => null,
            'expires_at' => $this->expires_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
        ];
    }
}
