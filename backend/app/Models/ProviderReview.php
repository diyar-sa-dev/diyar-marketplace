<?php

namespace App\Models;

use App\Enums\ProviderReviewStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderReview extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'provider_account_id',
        'user_id',
        'service_booking_id',
        'service_id',
        'rating',
        'title',
        'comment',
        'status',
        'provider_response',
        'provider_responded_at',
        'provider_responded_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'status' => ProviderReviewStatus::class,
            'provider_responded_at' => 'datetime',
        ];
    }

    public function providerAccount(): BelongsTo
    {
        return $this->belongsTo(ProviderAccount::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function serviceBooking(): BelongsTo
    {
        return $this->belongsTo(ServiceBooking::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function providerRespondedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'provider_responded_by_user_id');
    }
}
