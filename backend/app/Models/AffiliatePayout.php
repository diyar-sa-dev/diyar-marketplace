<?php

namespace App\Models;

use App\Enums\AffiliatePayoutStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AffiliatePayout extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'reference',
        'affiliate_profile_id',
        'amount',
        'currency',
        'status',
        'requested_at',
        'processed_at',
        'processed_by',
        'rejection_reason',
        'payment_reference',
        'idempotency_key',
    ];

    protected function casts(): array
    {
        return [
            'status' => AffiliatePayoutStatus::class,
            'amount' => 'decimal:2',
            'requested_at' => 'datetime',
            'processed_at' => 'datetime',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(AffiliateProfile::class, 'affiliate_profile_id');
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(AffiliateCommission::class);
    }
}
