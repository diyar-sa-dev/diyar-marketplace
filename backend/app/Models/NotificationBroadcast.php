<?php

namespace App\Models;

use App\Enums\NotificationBroadcastAudience;
use App\Enums\NotificationBroadcastStatus;
use App\Enums\NotificationPriority;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationBroadcast extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'created_by',
        'title',
        'body',
        'category',
        'channels',
        'audience_type',
        'audience_filter',
        'priority',
        'status',
        'total_recipients',
        'processed_recipients',
        'queued_recipients',
        'delivered_recipients',
        'failed_recipients',
        'suppressed_recipients',
        'scheduled_at',
        'expires_at',
        'started_at',
        'completed_at',
        'last_error',
    ];

    protected function casts(): array
    {
        return [
            'channels' => 'array',
            'audience_type' => NotificationBroadcastAudience::class,
            'audience_filter' => 'array',
            'priority' => NotificationPriority::class,
            'status' => NotificationBroadcastStatus::class,
            'scheduled_at' => 'datetime',
            'expires_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
