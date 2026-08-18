<?php

namespace App\Models;

use App\Enums\ServiceBookingPaymentStatus;
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
        'reference',
        'scheduled_date',
        'scheduled_time',
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
            'payment_status' => ServiceBookingPaymentStatus::class,
            'payment_strategy' => ServicePaymentStrategy::class,
            'price' => 'decimal:2',
            'scheduled_date' => 'date',
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
}
