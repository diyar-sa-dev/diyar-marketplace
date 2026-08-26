<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorShippingProfile extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'vendor_account_id',
        'shipping_method_id',
        'name',
        'is_default',
        'is_active',
        'volumetric_divisor',
        'handling_fee',
        'free_shipping_threshold',
        'delivery_estimate_days',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'is_active' => 'boolean',
            'volumetric_divisor' => 'integer',
            'handling_fee' => 'decimal:2',
            'free_shipping_threshold' => 'decimal:2',
            'delivery_estimate_days' => 'integer',
        ];
    }

    public function vendorAccount(): BelongsTo
    {
        return $this->belongsTo(VendorAccount::class);
    }

    public function shippingMethod(): BelongsTo
    {
        return $this->belongsTo(ShippingMethod::class, 'shipping_method_id');
    }
}
