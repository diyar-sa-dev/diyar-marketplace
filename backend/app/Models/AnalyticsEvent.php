<?php

namespace App\Models;

use App\Enums\AnalyticsEventType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnalyticsEvent extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'event_type',
        'subject_type',
        'subject_id',
        'user_id',
        'session_id',
        'vendor_account_id',
        'provider_account_id',
        'payload',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'event_type' => AnalyticsEventType::class,
            'payload' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
