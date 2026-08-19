<?php

namespace App\Models;

use App\Enums\ServiceBookingPaymentStatus;
use App\Enums\ServiceBookingSource;
use App\Enums\ServiceBookingStatus;
use App\Enums\ServicePaymentStrategy;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ServiceBooking extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'service_offer_id',
        'service_request_id',
        'user_id',
        'provider_account_id',
        'service_id',
        'booking_source',
        'idempotency_key',
        'service_title_snapshot',
        'reference',
        'scheduled_date',
        'scheduled_time',
        'requested_scheduled_date',
        'requested_scheduled_time',
        'proposed_scheduled_date',
        'proposed_scheduled_time',
        'schedule_proposed_at',
        'last_proposed_scheduled_date',
        'last_proposed_scheduled_time',
        'duration_minutes',
        'location',
        'customer_notes',
        'provider_notes',
        'price',
        'currency',
        'payment_strategy',
        'payment_status',
        'status',
        'completed_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ServiceBookingStatus::class,
            'booking_source' => ServiceBookingSource::class,
            'payment_status' => ServiceBookingPaymentStatus::class,
            'payment_strategy' => ServicePaymentStrategy::class,
            'price' => 'decimal:2',
            'scheduled_date' => 'date',
            'requested_scheduled_date' => 'date',
            'proposed_scheduled_date' => 'date',
            'last_proposed_scheduled_date' => 'date',
            'schedule_proposed_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function serviceOffer(): BelongsTo
    {
        return $this->belongsTo(ServiceOffer::class);
    }

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function providerAccount(): BelongsTo
    {
        return $this->belongsTo(ProviderAccount::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(ServiceBookingPayment::class);
    }

    public function providerReview(): HasOne
    {
        return $this->hasOne(ProviderReview::class);
    }
}
