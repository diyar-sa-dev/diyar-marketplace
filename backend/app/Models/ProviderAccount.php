<?php

namespace App\Models;

use App\Enums\ProviderAccountStatus;
use App\Support\SlugGenerator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

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

    protected static function booted(): void
    {
        static::creating(function (ProviderAccount $account) {
            if ($account->status === null) {
                $account->status = ProviderAccountStatus::Active;
            }

            if (($account->slug === null || $account->slug === '') && $account->business_name !== null && $account->business_name !== '') {
                $account->slug = SlugGenerator::unique($account->business_name, new ProviderAccount);
            }
        });

        static::saving(function (ProviderAccount $account) {
            if (($account->slug === null || $account->slug === '') && $account->business_name !== null && $account->business_name !== '') {
                $account->slug = SlugGenerator::unique($account->business_name, new ProviderAccount);
            }
        });
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

    public function bankAccounts(): HasMany
    {
        return $this->hasMany(ProviderBankAccount::class);
    }

    public function activeBankAccounts(): HasMany
    {
        return $this->hasMany(ProviderBankAccount::class)->where('is_active', true);
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(ProviderPayout::class);
    }

    public function workPolicy(): HasOne
    {
        return $this->hasOne(ProviderWorkPolicy::class);
    }

    public function serviceRequests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class);
    }

    public function serviceBookings(): HasMany
    {
        return $this->hasMany(ServiceBooking::class);
    }

    public function providerReviews(): HasMany
    {
        return $this->hasMany(ProviderReview::class);
    }

    public function adminAuditLogsAsResource(): HasMany
    {
        return $this->hasMany(AdminAuditLog::class, 'resource_id')
            ->where('resource_type', self::class);
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
