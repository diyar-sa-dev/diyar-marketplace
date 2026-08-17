<?php

namespace App\Http\Resources;

use App\Models\VendorShippingSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VendorShippingSettings */
class VendorShippingSettingsResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'carrier_enabled' => (bool) $this->carrier_enabled,
            'carrier_flat_rate' => $this->carrier_flat_rate !== null
                ? number_format((float) $this->carrier_flat_rate, 2, '.', '')
                : null,
            'carrier_free_shipping_enabled' => (bool) $this->carrier_free_shipping_enabled,
            'carrier_free_shipping_threshold' => $this->carrier_free_shipping_threshold !== null
                ? number_format((float) $this->carrier_free_shipping_threshold, 2, '.', '')
                : null,
            'pickup_enabled' => (bool) $this->pickup_enabled,
            'pickup_location_label' => $this->pickup_location_label,
        ];
    }
}
