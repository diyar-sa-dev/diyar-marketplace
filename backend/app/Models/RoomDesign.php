<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class RoomDesign extends Model
{
    use HasUuids, SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'title',
    ];

    protected $guarded = [
        'id',
        'user_id',
        'document',
        'schema_version',
        'version',
        'item_count',
    ];

    protected function casts(): array
    {
        return [
            'document' => 'array',
            'schema_version' => 'integer',
            'version' => 'integer',
            'item_count' => 'integer',
            'deleted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
