<?php

namespace App\Models;

use App\Enums\ProductPreorderStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPreorderRequest extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'product_id',
        'vendor_account_id',
        'selected_color',
        'unit_price',
        'status',
        'fulfilled_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'selected_color' => 'array',
            'unit_price' => 'decimal:2',
            'status' => ProductPreorderStatus::class,
            'fulfilled_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function vendorAccount(): BelongsTo
    {
        return $this->belongsTo(VendorAccount::class);
    }
}
