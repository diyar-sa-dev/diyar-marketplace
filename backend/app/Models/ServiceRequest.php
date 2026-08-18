<?php

namespace App\Models;

use App\Enums\ServiceRequestStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ServiceRequest extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'service_id',
        'provider_account_id',
        'reference',
        'title',
        'description',
        'budget_min',
        'budget_max',
        'location',
        'reference_links',
        'status',
        'accepted_offer_id',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ServiceRequestStatus::class,
            'budget_min' => 'decimal:2',
            'budget_max' => 'decimal:2',
            'reference_links' => 'array',
            'cancelled_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function providerAccount(): BelongsTo
    {
        return $this->belongsTo(ProviderAccount::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(
            ServiceCategory::class,
            'service_request_category',
            'service_request_id',
            'service_category_id',
        );
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(ServiceRequestAttachment::class);
    }

    public function offers(): HasMany
    {
        return $this->hasMany(ServiceOffer::class);
    }

    public function acceptedOffer(): BelongsTo
    {
        return $this->belongsTo(ServiceOffer::class, 'accepted_offer_id');
    }

    public function booking(): HasOne
    {
        return $this->hasOne(ServiceBooking::class);
    }
}
