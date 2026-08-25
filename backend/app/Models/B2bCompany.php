<?php

namespace App\Models;

use App\Enums\B2bPublicationStatus;
use App\Enums\B2bVerificationStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class B2bCompany extends Model
{
    use HasUuids, SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'b2b_category_id',
        'owner_user_id',
        'vendor_account_id',
        'provider_account_id',
        'slug',
        'name',
        'description',
        'about',
        'logo',
        'cover_image',
        'location',
        'address',
        'phone',
        'email',
        'website',
        'years_experience',
        'team_size',
        'completed_projects',
        'rating',
        'reviews_count',
        'publication_status',
        'verification_status',
        'featured',
        'published_at',
        'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'publication_status' => B2bPublicationStatus::class,
            'verification_status' => B2bVerificationStatus::class,
            'featured' => 'boolean',
            'published_at' => 'datetime',
            'rating' => 'decimal:2',
        ];
    }

    /** @param Builder<self> $query */
    public function scopePublished(Builder $query): Builder
    {
        return $query
            ->where('publication_status', B2bPublicationStatus::Published)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(B2bCategory::class, 'b2b_category_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function vendorAccount(): BelongsTo
    {
        return $this->belongsTo(VendorAccount::class, 'vendor_account_id');
    }

    public function providerAccount(): BelongsTo
    {
        return $this->belongsTo(ProviderAccount::class, 'provider_account_id');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(B2bTag::class, 'b2b_company_tag', 'b2b_company_id', 'b2b_tag_id');
    }

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'b2b_company_project', 'b2b_company_id', 'project_id')
            ->withPivot('sort_order')
            ->orderByPivot('sort_order');
    }

    public function services(): HasMany
    {
        return $this->hasMany(B2bCompanyService::class, 'b2b_company_id')->orderBy('sort_order');
    }

    public function testimonials(): HasMany
    {
        return $this->hasMany(B2bCompanyTestimonial::class, 'b2b_company_id')->orderBy('sort_order');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(B2bLead::class, 'b2b_company_id');
    }
}
