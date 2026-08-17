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
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'line_subtotal' => 'decimal:2',
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
