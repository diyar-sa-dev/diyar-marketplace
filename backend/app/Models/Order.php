<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'order_number',
        'status',
        'shipping_address_id',
        'shipping_recipient_name',
        'shipping_phone',
        'customer_email',
        'shipping_city',
        'shipping_district',
        'shipping_street',
        'shipping_building',
        'shipping_apartment',
        'subtotal',
        'shipping_total',
        'assembly_total',
        'discount_total',
        'vat_amount',
        'grand_total',
        'idempotency_key',
        'idempotency_payload_hash',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'subtotal' => 'decimal:2',
            'shipping_total' => 'decimal:2',
            'assembly_total' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'grand_total' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function shippingAddress(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'shipping_address_id');
    }

    public function vendorOrders(): HasMany
    {
        return $this->hasMany(VendorOrder::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }
}
