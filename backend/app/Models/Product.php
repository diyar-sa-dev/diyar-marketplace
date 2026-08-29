<?php

namespace App\Models;

use App\Enums\AvailabilityMode;
use App\Enums\ProductStatus;
use App\Enums\ProductType;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Schema;

class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'vendor_account_id',
        'category_id',
        'name',
        'slug',
        'description',
        'sale_price',
        'compare_price',
        'promotion_ends_at',
        'width',
        'height',
        'depth',
        'weight_kg',
        'materials',
        'warranty',
        'return_policy_override_enabled',
        'returnable',
        'return_window_days',
        'return_accepted_reasons',
        'return_requires_unused',
        'return_requires_evidence',
        'return_shipping_paid_by',
        'return_shipping_refundable',
        'product_type',
        'availability_mode',
        'expected_available_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'sale_price' => 'decimal:2',
            'compare_price' => 'decimal:2',
            'promotion_ends_at' => 'datetime',
            'width' => 'decimal:2',
            'height' => 'decimal:2',
            'depth' => 'decimal:2',
            'weight_kg' => 'decimal:3',
            'materials' => 'array',
            'return_policy_override_enabled' => 'boolean',
            'returnable' => 'boolean',
            'return_window_days' => 'integer',
            'return_accepted_reasons' => 'array',
            'return_requires_unused' => 'boolean',
            'return_requires_evidence' => 'boolean',
            'return_shipping_refundable' => 'boolean',
            'product_type' => ProductType::class,
            'availability_mode' => AvailabilityMode::class,
            'expected_available_at' => 'date',
            'status' => ProductStatus::class,
        ];
    }

    public function vendorAccount(): BelongsTo
    {
        return $this->belongsTo(VendorAccount::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function colors(): HasMany
    {
        return $this->hasMany(ProductColor::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function inventory(): HasOne
    {
        return $this->hasOne(ProductInventory::class);
    }

    public function affiliateSetting(): HasOne
    {
        return $this->hasOne(ProductAffiliateSetting::class);
    }

    public function inventoryMovements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    public function inventoryReservations(): HasMany
    {
        return $this->hasMany(InventoryReservation::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(ProductLike::class);
    }

    public function wishlistItems(): HasMany
    {
        return $this->hasMany(WishlistItem::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }

    public function scopePubliclyVisible($query)
    {
        return $query
            ->where('status', ProductStatus::Active)
            ->whereIn('vendor_account_id', function ($subquery) {
                $subquery->select('id')
                    ->from('vendor_accounts')
                    ->where('status', 'active');
            });
    }

    /**
     * @param  Builder<Product>  $query
     */
    public function scopeWithActiveDiscount(Builder $query): void
    {
        $query->whereNotNull('compare_price')
            ->whereColumn('compare_price', '>', 'sale_price')
            ->where(function (Builder $promotionQuery) {
                $promotionQuery->whereNull('promotion_ends_at')
                    ->orWhere('promotion_ends_at', '>', now());
            });
    }

    /**
     * @param  Builder<Product>  $query
     */
    public function scopeWithUserSaved(Builder $query, ?User $user): void
    {
        if ($user === null || ! Schema::hasTable('wishlist_items')) {
            return;
        }

        $query->withExists([
            'wishlistItems as user_saved' => fn (Builder $wishlistQuery) => $wishlistQuery
                ->where('user_id', $user->id),
        ]);
    }
}
