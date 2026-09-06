<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorCouponScope extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'vendor_coupon_id',
        'scope_type',
        'scope_id',
    ];

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(VendorCoupon::class, 'vendor_coupon_id');
    }
}
