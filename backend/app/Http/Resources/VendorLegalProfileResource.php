<?php

namespace App\Http\Resources;

use App\Models\VendorLegalProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VendorLegalProfile */
class VendorLegalProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'entity_type' => $this->entity_type->value,
            'commercial_registration_number' => $this->commercial_registration_number,
            'tax_number' => $this->tax_number,
        ];
    }
}
