<?php

namespace App\Models;

use App\Enums\NotificationChannel;
use App\Enums\NotificationDeliveryStatus;
use App\Enums\NotificationFailureCategory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationDelivery extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_notification_id',
        'user_id',
        'channel',
        'provider',
        'status',
        'dedupe_key',
        'attempts',
        'last_error',
        'failure_code',
        'failure_category',
        'provider_message_id',
        'correlation_id',
        'last_attempt_at',
        'claimed_at',
        'processing_token',
        'processing_lease_until',
        'next_retry_at',
        'delivered_at',
        'failed_at',
    ];

    protected function casts(): array
    {
        return [
            'channel' => NotificationChannel::class,
            'status' => NotificationDeliveryStatus::class,
            'failure_category' => NotificationFailureCategory::class,
            'delivered_at' => 'datetime',
            'failed_at' => 'datetime',
            'last_attempt_at' => 'datetime',
            'claimed_at' => 'datetime',
            'processing_lease_until' => 'datetime',
            'next_retry_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function notification(): BelongsTo
    {
        return $this->belongsTo(UserNotification::class, 'user_notification_id');
    }
}
