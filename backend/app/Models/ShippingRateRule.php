<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShippingRateRule extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'shipping_method_id',
        'zone_id',
        'vendor_account_id',
        'min_weight_kg',
        'max_weight_kg',
        'min_subtotal',
        'max_subtotal',
        'rate',
        'handling_fee',
        'free_shipping_threshold',
        'volumetric_divisor',
        'delivery_estimate_days',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'min_weight_kg' => 'decimal:3',
            'max_weight_kg' => 'decimal:3',
            'min_subtotal' => 'decimal:2',
            'max_subtotal' => 'decimal:2',
            'rate' => 'decimal:2',
            'handling_fee' => 'decimal:2',
            'free_shipping_threshold' => 'decimal:2',
            'volumetric_divisor' => 'integer',
            'delivery_estimate_days' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function shippingMethod(): BelongsTo
    {
        return $this->belongsTo(ShippingMethod::class, 'shipping_method_id');
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(ShippingZone::class, 'zone_id');
    }

    public function vendorAccount(): BelongsTo
    {
        return $this->belongsTo(VendorAccount::class);
    }
}
