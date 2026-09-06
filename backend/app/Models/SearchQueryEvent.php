<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SearchQueryEvent extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'query',
        'normalized_query',
        'search_type',
        'result_count',
        'user_id',
        'session_id',
        'locale',
        'source',
        'filters',
        'duration_ms',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'filters' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
