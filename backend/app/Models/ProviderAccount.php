<?php

namespace App\Models;

use App\Enums\ProviderAccountStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProviderAccount extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'business_name',
        'slug',
        'bio',
        'avatar_path',
        'cover_path',
        'location',
        'remote_available',
        'verified',
        'working_hours',
        'badges',
        'status',
        'completed_projects_count',
        'rating_average',
        'reviews_count',
        'joined_at',
    ];

    protected function casts(): array
    {
        return [
            'remote_available' => 'boolean',
            'verified' => 'boolean',
            'working_hours' => 'array',
            'badges' => 'array',
            'status' => ProviderAccountStatus::class,
            'completed_projects_count' => 'integer',
            'rating_average' => 'decimal:2',
            'reviews_count' => 'integer',
            'joined_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function portfolioItems(): HasMany
    {
        return $this->hasMany(ServicePortfolioItem::class);
    }

    public function followers(): HasMany
    {
        return $this->hasMany(ProviderFollow::class);
    }

    /**
     * @param  Builder<ProviderAccount>  $query
     * @return Builder<ProviderAccount>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query
            ->where('status', ProviderAccountStatus::Active)
            ->whereNotNull('slug')
            ->where('slug', '!=', '');
    }
}
