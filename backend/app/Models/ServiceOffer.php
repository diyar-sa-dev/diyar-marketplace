<?php

namespace App\Models;

use App\Enums\ServiceOfferStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ServiceOffer extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'service_request_id',
        'provider_account_id',
        'proposed_price',
        'currency',
        'duration_days',
        'proposed_scheduled_date',
        'proposed_scheduled_time',
        'message',
        'quotation_disk',
        'quotation_path',
        'quotation_original_name',
        'expires_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => ServiceOfferStatus::class,
            'proposed_price' => 'decimal:2',
            'proposed_scheduled_date' => 'date',
            'expires_at' => 'datetime',
        ];
    }

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }

    public function providerAccount(): BelongsTo
    {
        return $this->belongsTo(ProviderAccount::class);
    }

    public function booking(): HasOne
    {
        return $this->hasOne(ServiceBooking::class);
    }
}
