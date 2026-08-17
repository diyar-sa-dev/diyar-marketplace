<?php

namespace Database\Seeders;

use App\Models\VendorAccount;
use App\Models\VendorShippingSettings;
use Illuminate\Database\Seeder;

class VendorShippingSettingsSeeder extends Seeder
{
    /**
     * Dev/demo defaults only — production vendors must configure shipping explicitly.
     */
    public function run(): void
    {
        VendorAccount::query()->each(function (VendorAccount $vendor): void {
            if (VendorShippingSettings::query()->where('vendor_account_id', $vendor->id)->exists()) {
                return;
            }

            VendorShippingSettings::query()->create([
                'vendor_account_id' => $vendor->id,
                'carrier_enabled' => true,
                'carrier_flat_rate' => '28.00',
                'carrier_free_shipping_enabled' => false,
                'carrier_free_shipping_threshold' => null,
                'pickup_enabled' => true,
                'pickup_location_label' => $vendor->location
                    ? 'فرع '.$vendor->business_name.' — '.$vendor->location
                    : 'فرع '.$vendor->business_name,
            ]);
        });
    }
}
