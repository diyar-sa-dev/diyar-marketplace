<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CarrierShipment extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'shipment_id',
        'carrier_id',
        'carrier_code',
        'external_shipment_id',
        'tracking_number',
        'label_url',
        'label_storage_path',
        'carrier_quoted_cost',
        'carrier_actual_cost',
        'booking_status',
        'booked_at',
    ];

    protected function casts(): array
    {
        return [
            'carrier_quoted_cost' => 'decimal:2',
            'carrier_actual_cost' => 'decimal:2',
            'booked_at' => 'datetime',
        ];
    }

    public function shipment(): BelongsTo
    {
        return $this->belongsTo(Shipment::class);
    }

    public function carrier(): BelongsTo
    {
        return $this->belongsTo(ShippingCarrier::class, 'carrier_id');
    }

    public function bookingAttempts(): HasMany
    {
        return $this->hasMany(CarrierBookingAttempt::class);
    }
}
