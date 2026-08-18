<?php

namespace App\Http\Resources;

use App\Models\VendorWorkingHour;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VendorWorkingHour */
class VendorWorkingHourResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'day' => $this->day->value,
            'is_closed' => $this->is_closed,
            'opens_at' => $this->opens_at !== null ? substr((string) $this->opens_at, 0, 5) : null,
            'closes_at' => $this->closes_at !== null ? substr((string) $this->closes_at, 0, 5) : null,
            'closes_next_day' => $this->closes_next_day,
        ];
    }
}
