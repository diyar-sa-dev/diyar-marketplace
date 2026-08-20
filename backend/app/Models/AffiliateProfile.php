<?php

namespace App\Models;

use App\Enums\AffiliateProfileStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AffiliateProfile extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'referral_code',
        'status',
        'display_name',
        'payout_account_holder',
        'payout_iban',
        'payout_bank_code',
        'payout_bank_name',
        'social_links',
    ];

    protected function casts(): array
    {
        return [
            'status' => AffiliateProfileStatus::class,
            'social_links' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function links(): HasMany
    {
        return $this->hasMany(AffiliateLink::class);
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(AffiliateCommission::class);
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(AffiliatePayout::class);
    }
}
