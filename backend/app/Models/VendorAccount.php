<?php

namespace App\Models;

use App\Enums\VendorAccountStatus;
use App\Support\SlugGenerator;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class VendorAccount extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'business_name',
        'slug',
        'description',
        'location',
        'status',
        'logo_path',
        'cover_path',
        'support_phone',
        'support_email',
        'website_url',
    ];

    protected function casts(): array
    {
        return [
            'status' => VendorAccountStatus::class,
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (VendorAccount $account) {
            if ($account->status === null) {
                $account->status = VendorAccountStatus::Active;
            }

            if (($account->slug === null || $account->slug === '') && $account->business_name !== null && $account->business_name !== '') {
                $account->slug = SlugGenerator::unique($account->business_name, new VendorAccount);
            }
        });

        static::saving(function (VendorAccount $account) {
            if (($account->slug === null || $account->slug === '') && $account->business_name !== null && $account->business_name !== '') {
                $account->slug = SlugGenerator::unique($account->business_name, new VendorAccount);
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function shippingSettings(): HasOne
    {
        return $this->hasOne(VendorShippingSettings::class);
    }

    public function returnPolicy(): HasOne
    {
        return $this->hasOne(VendorReturnPolicy::class);
    }

    public function storeReviews(): HasMany
    {
        return $this->hasMany(StoreReview::class);
    }

    public function legalProfile(): HasOne
    {
        return $this->hasOne(VendorLegalProfile::class);
    }

    public function bankAccounts(): HasMany
    {
        return $this->hasMany(VendorBankAccount::class);
    }

    public function activeBankAccount(): HasOne
    {
        return $this->hasOne(VendorBankAccount::class)->where('is_active', true)->latest();
    }

    public function workingHours(): HasMany
    {
        return $this->hasMany(VendorWorkingHour::class);
    }

    public function followers(): HasMany
    {
        return $this->hasMany(VendorStoreFollow::class);
    }

    public function teamMembers(): HasMany
    {
        return $this->hasMany(VendorTeamMember::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', VendorAccountStatus::Active);
    }
}
