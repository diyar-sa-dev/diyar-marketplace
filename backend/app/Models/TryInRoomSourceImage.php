<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TryInRoomSourceImage extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'disk',
        'path',
        'mime',
        'width_px',
        'height_px',
        'size_bytes',
    ];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'width_px' => 'integer',
            'height_px' => 'integer',
            'size_bytes' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(TryInRoomJob::class, 'source_image_id');
    }
}
