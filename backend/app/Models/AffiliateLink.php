<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AffiliateLink extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'affiliate_profile_id',
        'product_id',
        'name',
        'referral_code',
        'commission_rate_percent',
        'is_active',
        'campaign_name',
        'source',
        'click_count',
        'conversion_count',
        'total_earnings',
    ];

    protected function casts(): array
    {
        return [
            'commission_rate_percent' => 'decimal:2',
            'is_active' => 'boolean',
            'click_count' => 'integer',
            'conversion_count' => 'integer',
            'total_earnings' => 'decimal:2',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(AffiliateProfile::class, 'affiliate_profile_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function clicks(): HasMany
    {
        return $this->hasMany(AffiliateClick::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(AffiliateCommission::class);
    }
}
