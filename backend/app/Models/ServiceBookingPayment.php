<?php

namespace App\Models;

use App\Enums\ServiceBookingPaymentStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceBookingPayment extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'service_booking_id',
        'status',
        'amount',
        'currency',
        'gateway',
        'payment_method',
        'payment_reference',
        'gateway_payment_id',
        'paid_at',
        'failed_at',
        'failure_reason',
    ];

    protected function casts(): array
    {
        return [
            'status' => ServiceBookingPaymentStatus::class,
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    public function serviceBooking(): BelongsTo
    {
        return $this->belongsTo(ServiceBooking::class);
    }
}
