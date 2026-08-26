<?php

namespace App\Models;

use App\Enums\ShippingRateMethodType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShippingMethod extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'carrier_id',
        'code',
        'name',
        'method_type',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'method_type' => ShippingRateMethodType::class,
            'is_active' => 'boolean',
        ];
    }

    public function carrier(): BelongsTo
    {
        return $this->belongsTo(ShippingCarrier::class, 'carrier_id');
    }

    public function rateRules(): HasMany
    {
        return $this->hasMany(ShippingRateRule::class, 'shipping_method_id');
    }
}
