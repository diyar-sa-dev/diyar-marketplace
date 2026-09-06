<?php

namespace App\Models;

use App\Enums\CouponScopeType;
use App\Enums\VendorCouponType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VendorCoupon extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'vendor_account_id',
        'code',
        'type',
        'scope_type',
        'stackable',
        'exclusive_group',
        'value',
        'fixed_amount',
        'minimum_order',
        'maximum_discount',
        'starts_at',
        'ends_at',
        'usage_limit',
        'usage_limit_per_user',
        'used_count',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'type' => VendorCouponType::class,
            'scope_type' => CouponScopeType::class,
            'stackable' => 'boolean',
            'value' => 'integer',
            'fixed_amount' => 'decimal:2',
            'minimum_order' => 'decimal:2',
            'maximum_discount' => 'decimal:2',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'usage_limit' => 'integer',
            'usage_limit_per_user' => 'integer',
            'used_count' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function vendorAccount(): BelongsTo
    {
        return $this->belongsTo(VendorAccount::class);
    }

    public function usages(): HasMany
    {
        return $this->hasMany(VendorCouponUsage::class);
    }

    public function scopes(): HasMany
    {
        return $this->hasMany(VendorCouponScope::class);
    }

    public function exclusions(): HasMany
    {
        return $this->hasMany(VendorCouponExclusion::class);
    }

    public static function normalizeCode(string $code): string
    {
        return strtoupper(trim($code));
    }
}
