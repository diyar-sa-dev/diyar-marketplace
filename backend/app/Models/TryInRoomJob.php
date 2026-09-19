<?php

namespace App\Models;

use App\Enums\TryInRoomJobStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TryInRoomJob extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'source_image_id',
        'product_id',
        'room_design_id',
        'idempotency_key',
        'queued_at',
        'expires_at',
    ];

    protected $guarded = [
        'id',
        'error_code',
        'result',
        'provider_key',
        'provider_metadata',
        'attempts',
        'started_at',
        'completed_at',
        'failed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => TryInRoomJobStatus::class,
            'result' => 'array',
            'provider_metadata' => 'array',
            'attempts' => 'integer',
            'queued_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'failed_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sourceImage(): BelongsTo
    {
        return $this->belongsTo(TryInRoomSourceImage::class, 'source_image_id');
    }

    public function roomDesign(): BelongsTo
    {
        return $this->belongsTo(RoomDesign::class, 'room_design_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
