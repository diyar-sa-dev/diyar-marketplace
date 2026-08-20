<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'vendor_order_id',
        'product_id',
        'product_name',
        'product_slug',
        'unit_price',
        'quantity',
        'line_subtotal',
        'color_name',
        'color_hex',
        'affiliate_profile_id',
        'affiliate_link_id',
        'affiliate_commission_rate',
        'affiliate_commission_base',
        'affiliate_commission_amount',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'line_subtotal' => 'decimal:2',
            'affiliate_commission_rate' => 'decimal:2',
            'affiliate_commission_base' => 'decimal:2',
            'affiliate_commission_amount' => 'decimal:2',
        ];
    }

    public function vendorOrder(): BelongsTo
    {
        return $this->belongsTo(VendorOrder::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
