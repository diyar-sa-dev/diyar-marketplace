<?php

namespace App\Models;

use App\Enums\VendorOrderStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class VendorOrder extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'order_id',
        'vendor_account_id',
        'status',
        'subtotal',
        'shipping_method',
        'shipping_cost',
        'shipping_discount_amount',
        'pickup_location_label',
        'free_shipping_applied',
        'assembly_cost',
        'discount_amount',
        'vat_amount',
        'vendor_total',
        'vendor_coupon_id',
        'coupon_code',
        'coupon_percent_snapshot',
        'coupon_discount_snapshot',
        'coupon_type_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'status' => VendorOrderStatus::class,
            'subtotal' => 'decimal:2',
            'shipping_cost' => 'decimal:2',
            'shipping_discount_amount' => 'decimal:2',
            'free_shipping_applied' => 'boolean',
            'assembly_cost' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'vendor_total' => 'decimal:2',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function vendorAccount(): BelongsTo
    {
        return $this->belongsTo(VendorAccount::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function shipment(): HasOne
    {
        return $this->hasOne(Shipment::class);
    }
}
