<?php

namespace App\Domains\TryInRoom\Resources;

use App\Models\TryInRoomJob;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TryInRoomJob */
class TryInRoomJobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $completed = $this->status->value === 'completed';

        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'product_id' => $this->product_id,
            'room_design_id' => $this->room_design_id,
            'error_code' => $this->error_code,
            'result' => $this->when($completed, $this->publicResult()),
            'result_url' => $completed ? $this->ownerResultUrl() : null,
            'expires_at' => $this->expires_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function publicResult(): ?array
    {
        $result = $this->result;
        if (! is_array($result)) {
            return null;
        }

        unset($result['result_path'], $result['result_disk']);

        return $result;
    }

    private function ownerResultUrl(): ?string
    {
        $path = $this->result['result_path'] ?? null;
        if (! is_string($path) || $path === '') {
            return null;
        }

        return '/api/v1/try-in-room/'.$this->id.'/result';
    }
}
