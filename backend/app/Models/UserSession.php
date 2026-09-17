<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSession extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $hidden = [
        'laravel_session_id',
        'session_lookup_hash',
        'ip_address',
    ];

    protected $fillable = [
        'user_id',
        'session_lookup_hash',
        'laravel_session_id',
        'device_type',
        'browser',
        'browser_version',
        'platform',
        'platform_version',
        'device_name',
        'ip_address',
        'country',
        'city',
        'region',
        'location_source',
        'first_seen_at',
        'last_activity_at',
        'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'laravel_session_id' => 'encrypted',
            'first_seen_at' => 'datetime',
            'last_activity_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return $this->revoked_at === null;
    }
}
