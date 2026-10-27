<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarrierBookingAttempt extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'carrier_shipment_id',
        'idempotency_key',
        'status',
        'request_payload_sanitized',
        'response_payload_sanitized',
        'error_code',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'request_payload_sanitized' => 'array',
            'response_payload_sanitized' => 'array',
        ];
    }

    public function carrierShipment(): BelongsTo
    {
        return $this->belongsTo(CarrierShipment::class);
    }
}
