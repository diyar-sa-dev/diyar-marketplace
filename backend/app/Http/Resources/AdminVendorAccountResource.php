<?php

namespace App\Http\Resources;

use App\Models\VendorAccount;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VendorAccount */
class AdminVendorAccountResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_name' => $this->business_name,
            'slug' => $this->slug,
            'status' => $this->status->value,
            'location' => $this->location,
            'support_email' => $this->support_email,
            'support_phone' => $this->support_phone,
            'created_at' => $this->created_at?->toIso8601String(),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
                'phone' => $this->user?->phone,
                'status' => $this->user?->status?->value,
            ]),
        ];
    }
}
