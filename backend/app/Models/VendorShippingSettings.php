<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorShippingSettings extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'vendor_account_id',
        'carrier_enabled',
        'carrier_flat_rate',
        'carrier_free_shipping_enabled',
        'carrier_free_shipping_threshold',
        'pickup_enabled',
        'pickup_location_label',
    ];

    protected function casts(): array
    {
        return [
            'carrier_enabled' => 'boolean',
            'carrier_flat_rate' => 'decimal:2',
            'carrier_free_shipping_enabled' => 'boolean',
            'carrier_free_shipping_threshold' => 'decimal:2',
            'pickup_enabled' => 'boolean',
        ];
    }

    public function vendorAccount(): BelongsTo
    {
        return $this->belongsTo(VendorAccount::class);
    }

    public function isCheckoutEligible(): bool
    {
        return $this->carrier_enabled || $this->pickup_enabled;
    }
}
