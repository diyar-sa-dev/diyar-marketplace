<?php

namespace App\Models;

use App\Enums\ServiceBookingMode;
use App\Enums\ServicePricingMode;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;

class Service extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'provider_account_id',
        'service_category_id',
        'title',
        'slug',
        'description',
        'pricing_mode',
        'booking_mode',
        'starting_price',
        'currency',
        'delivery_type_label',
        'duration_label',
        'duration_minutes',
        'location',
        'remote_available',
        'features',
        'cover_path',
        'is_active',
        'requests_count',
        'rating_average',
        'reviews_count',
    ];

    protected function casts(): array
    {
        return [
            'pricing_mode' => ServicePricingMode::class,
            'booking_mode' => ServiceBookingMode::class,
            'starting_price' => 'decimal:2',
            'duration_minutes' => 'integer',
            'remote_available' => 'boolean',
            'features' => 'array',
            'is_active' => 'boolean',
            'requests_count' => 'integer',
            'rating_average' => 'decimal:2',
            'reviews_count' => 'integer',
        ];
    }

    public function providerAccount(): BelongsTo
    {
        return $this->belongsTo(ProviderAccount::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }

    public function portfolioItems(): HasMany
    {
        return $this->hasMany(ServicePortfolioItem::class);
    }

    public function providerReviews(): HasMany
    {
        return $this->hasMany(ProviderReview::class);
    }

    public function wishlistItems(): HasMany
    {
        return $this->hasMany(ServiceWishlistItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * @param  Builder<Service>  $query
     */
    public function scopeWithUserSaved(Builder $query, ?User $user): void
    {
        if ($user === null || ! Schema::hasTable('service_wishlist_items')) {
            return;
        }

        $query->withExists([
            'wishlistItems as user_saved' => fn (Builder $wishlistQuery) => $wishlistQuery
                ->where('user_id', $user->id),
        ]);
    }
}
