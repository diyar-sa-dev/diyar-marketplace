<?php

namespace App\Http\Resources;

use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Address */
class AddressResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'type' => $this->type->value,
            'recipient_name' => $this->recipient_name,
            'phone' => $this->phone,
            'city' => $this->city,
            'district' => $this->district,
            'street' => $this->street,
            'building' => $this->building,
            'apartment' => $this->apartment,
            'is_default' => $this->is_default,
            'formatted_summary' => $this->formattedSummary(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
