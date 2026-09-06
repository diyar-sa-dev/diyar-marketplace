<?php

namespace App\Models;

use App\Enums\DomainOutboxEventStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DomainOutboxEvent extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'domain_outbox_events';

    protected $fillable = [
        'aggregate_type',
        'aggregate_id',
        'event_type',
        'payload',
        'occurred_at',
        'available_at',
        'status',
        'attempts',
        'locked_at',
        'locked_by',
        'processed_at',
        'last_error',
        'correlation_id',
        'idempotency_key',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'status' => DomainOutboxEventStatus::class,
            'occurred_at' => 'datetime',
            'available_at' => 'datetime',
            'locked_at' => 'datetime',
            'processed_at' => 'datetime',
        ];
    }
}
