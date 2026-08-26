<?php

namespace App\Models;

use App\Enums\PaymentWebhookProcessingStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentWebhookEvent extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'gateway',
        'event_type',
        'webhook_version',
        'signature_valid',
        'payload_hash',
        'payload',
        'processing_status',
        'payment_id',
        'processing_attempts',
        'processing_leased_until',
        'correlation_id',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'signature_valid' => 'boolean',
            'payload' => 'array',
            'processing_status' => PaymentWebhookProcessingStatus::class,
            'processed_at' => 'datetime',
        ];
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
