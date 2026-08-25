<?php

namespace App\Models;

use App\Enums\ProjectPublicationStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasUuids, SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'slug',
        'title',
        'description',
        'category',
        'location',
        'year',
        'status',
        'cover_image',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ProjectPublicationStatus::class,
            'year' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProjectImage::class)->orderBy('sort_order');
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query
            ->where('status', ProjectPublicationStatus::Published)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }
}
