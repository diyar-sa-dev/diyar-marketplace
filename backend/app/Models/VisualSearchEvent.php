<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VisualSearchEvent extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'search_id',
        'event_type',
        'occurred_at',
        'query_fingerprint',
        'product_id',
        'rank_position',
        'similarity_score',
        'engine_version',
        'representation_version',
        'ranking_version',
        'index_version',
        'user_id',
        'session_key',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'rank_position' => 'integer',
            'similarity_score' => 'decimal:4',
            'metadata' => 'array',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
