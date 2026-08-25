<?php

namespace App\Services\B2b;

use App\Enums\B2bPublicationStatus;
use App\Enums\B2bVerificationStatus;
use App\Models\B2bCategory;
use App\Models\B2bCompany;
use App\Models\B2bCompanyService;
use App\Models\B2bCompanyTestimonial;
use App\Models\B2bTag;
use App\Models\User;
use App\Services\Admin\AdminAuditService;
use App\Support\Cache\B2bCache;
use Illuminate\Support\Facades\DB;

final class AdminB2bService
{
    public function __construct(
        private readonly B2bService $b2b,
        private readonly AdminAuditService $audit,
        private readonly B2bCache $cache,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function createCompany(array $attributes, User $actor): B2bCompany
    {
        return DB::transaction(function () use ($attributes, $actor): B2bCompany {
            $slug = $this->b2b->generateCompanySlug(
                $attributes['name'],
                $attributes['slug'] ?? null,
            );

            $company = B2bCompany::query()->create([
                'b2b_category_id' => $attributes['b2b_category_id'] ?? null,
                'owner_user_id' => $attributes['owner_user_id'] ?? null,
                'vendor_account_id' => $attributes['vendor_account_id'] ?? null,
                'provider_account_id' => $attributes['provider_account_id'] ?? null,
                'slug' => $slug,
                'name' => $attributes['name'],
                'description' => $attributes['description'] ?? null,
                'about' => $this->b2b->sanitizeAbout($attributes['about'] ?? null),
                'logo' => $attributes['logo'] ?? null,
                'cover_image' => $attributes['cover_image'] ?? null,
                'location' => $attributes['location'] ?? null,
                'address' => $attributes['address'] ?? null,
                'phone' => $attributes['phone'] ?? null,
                'email' => $attributes['email'] ?? null,
                'website' => $attributes['website'] ?? null,
                'years_experience' => $attributes['years_experience'] ?? null,
                'team_size' => $attributes['team_size'] ?? null,
                'completed_projects' => $attributes['completed_projects'] ?? 0,
                'rating' => $attributes['rating'] ?? 0,
                'reviews_count' => $attributes['reviews_count'] ?? 0,
                'publication_status' => $attributes['publication_status'] ?? B2bPublicationStatus::Draft->value,
                'verification_status' => $attributes['verification_status'] ?? B2bVerificationStatus::Pending->value,
                'featured' => (bool) ($attributes['featured'] ?? false),
                'published_at' => $attributes['published_at'] ?? null,
                'admin_notes' => $attributes['admin_notes'] ?? null,
            ]);

            $this->syncRelations($company, $attributes);
            $company->load(['category', 'tags', 'services', 'testimonials', 'projects']);

            $this->audit->record(
                actor: $actor,
                action: 'b2b_company.create',
                resource: $company,
                after: $this->companySnapshot($company),
            );

            $this->cache->forget();

            return $company;
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function updateCompany(B2bCompany $company, array $attributes, User $actor): B2bCompany
    {
        return DB::transaction(function () use ($company, $attributes, $actor): B2bCompany {
            $before = $this->companySnapshot($company);

            if (array_key_exists('name', $attributes) || array_key_exists('slug', $attributes)) {
                $attributes['slug'] = $this->b2b->generateCompanySlug(
                    $attributes['name'] ?? $company->name,
                    $attributes['slug'] ?? null,
                    $company->id,
                );
            }

            if (array_key_exists('about', $attributes)) {
                $attributes['about'] = $this->b2b->sanitizeAbout($attributes['about']);
            }

            $company->fill([
                'b2b_category_id' => $attributes['b2b_category_id'] ?? $company->b2b_category_id,
                'owner_user_id' => $attributes['owner_user_id'] ?? $company->owner_user_id,
                'vendor_account_id' => $attributes['vendor_account_id'] ?? $company->vendor_account_id,
                'provider_account_id' => $attributes['provider_account_id'] ?? $company->provider_account_id,
                'slug' => $attributes['slug'] ?? $company->slug,
                'name' => $attributes['name'] ?? $company->name,
                'description' => $attributes['description'] ?? $company->description,
                'about' => $attributes['about'] ?? $company->about,
                'logo' => $attributes['logo'] ?? $company->logo,
                'cover_image' => $attributes['cover_image'] ?? $company->cover_image,
                'location' => $attributes['location'] ?? $company->location,
                'address' => $attributes['address'] ?? $company->address,
                'phone' => $attributes['phone'] ?? $company->phone,
                'email' => $attributes['email'] ?? $company->email,
                'website' => $attributes['website'] ?? $company->website,
                'years_experience' => $attributes['years_experience'] ?? $company->years_experience,
                'team_size' => $attributes['team_size'] ?? $company->team_size,
                'completed_projects' => $attributes['completed_projects'] ?? $company->completed_projects,
                'rating' => $attributes['rating'] ?? $company->rating,
                'reviews_count' => $attributes['reviews_count'] ?? $company->reviews_count,
                'publication_status' => $attributes['publication_status'] ?? $company->publication_status,
                'verification_status' => $attributes['verification_status'] ?? $company->verification_status,
                'featured' => $attributes['featured'] ?? $company->featured,
                'published_at' => $attributes['published_at'] ?? $company->published_at,
                'admin_notes' => $attributes['admin_notes'] ?? $company->admin_notes,
            ])->save();

            $this->syncRelations($company, $attributes);
            $company->load(['category', 'tags', 'services', 'testimonials', 'projects']);

            $this->audit->record(
                actor: $actor,
                action: 'b2b_company.update',
                resource: $company,
                before: $before,
                after: $this->companySnapshot($company),
            );

            $this->cache->forget();

            return $company;
        });
    }

    public function deleteCompany(B2bCompany $company, User $actor): void
    {
        DB::transaction(function () use ($company, $actor): void {
            $before = $this->companySnapshot($company);
            $company->delete();

            $this->audit->record(
                actor: $actor,
                action: 'b2b_company.delete',
                resource: $company,
                before: $before,
            );

            $this->cache->forget();
        });
    }

    public function publishCompany(B2bCompany $company, User $actor): B2bCompany
    {
        return $this->transitionCompany($company, $actor, B2bPublicationStatus::Published, 'b2b_company.publish', [
            'published_at' => $company->published_at ?? now(),
        ]);
    }

    public function unpublishCompany(B2bCompany $company, User $actor): B2bCompany
    {
        return $this->transitionCompany($company, $actor, B2bPublicationStatus::Draft, 'b2b_company.unpublish');
    }

    public function archiveCompany(B2bCompany $company, User $actor): B2bCompany
    {
        return $this->transitionCompany($company, $actor, B2bPublicationStatus::Archived, 'b2b_company.archive');
    }

    public function verifyCompany(B2bCompany $company, User $actor): B2bCompany
    {
        return $this->transitionVerification($company, $actor, B2bVerificationStatus::Verified, 'b2b_company.verify');
    }

    public function rejectCompanyVerification(B2bCompany $company, User $actor): B2bCompany
    {
        return $this->transitionVerification($company, $actor, B2bVerificationStatus::Rejected, 'b2b_company.reject_verification');
    }

    public function featureCompany(B2bCompany $company, User $actor): B2bCompany
    {
        return DB::transaction(function () use ($company, $actor): B2bCompany {
            $before = $this->companySnapshot($company);
            $company->update(['featured' => true]);
            $company->load(['category', 'tags']);

            $this->audit->record(
                actor: $actor,
                action: 'b2b_company.feature',
                resource: $company,
                before: $before,
                after: $this->companySnapshot($company),
            );

            $this->cache->forget();

            return $company;
        });
    }

    public function unfeatureCompany(B2bCompany $company, User $actor): B2bCompany
    {
        return DB::transaction(function () use ($company, $actor): B2bCompany {
            $before = $this->companySnapshot($company);
            $company->update(['featured' => false]);
            $company->load(['category', 'tags']);

            $this->audit->record(
                actor: $actor,
                action: 'b2b_company.unfeature',
                resource: $company,
                before: $before,
                after: $this->companySnapshot($company),
            );

            $this->cache->forget();

            return $company;
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function createCategory(array $attributes, User $actor): B2bCategory
    {
        return DB::transaction(function () use ($attributes, $actor): B2bCategory {
            $category = B2bCategory::query()->create([
                'name' => $attributes['name'],
                'slug' => $this->b2b->generateCategorySlug($attributes['name'], $attributes['slug'] ?? null),
                'description' => $attributes['description'] ?? null,
            ]);

            $this->audit->record(
                actor: $actor,
                action: 'b2b_category.create',
                resource: $category,
                after: $this->categorySnapshot($category),
            );

            $this->cache->forget();

            return $category;
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function updateCategory(B2bCategory $category, array $attributes, User $actor): B2bCategory
    {
        return DB::transaction(function () use ($category, $attributes, $actor): B2bCategory {
            $before = $this->categorySnapshot($category);

            if (array_key_exists('name', $attributes) || array_key_exists('slug', $attributes)) {
                $attributes['slug'] = $this->b2b->generateCategorySlug(
                    $attributes['name'] ?? $category->name,
                    $attributes['slug'] ?? null,
                );
            }

            $category->fill([
                'name' => $attributes['name'] ?? $category->name,
                'slug' => $attributes['slug'] ?? $category->slug,
                'description' => $attributes['description'] ?? $category->description,
            ])->save();

            $this->audit->record(
                actor: $actor,
                action: 'b2b_category.update',
                resource: $category,
                before: $before,
                after: $this->categorySnapshot($category),
            );

            $this->cache->forget();

            return $category;
        });
    }

    public function deleteCategory(B2bCategory $category, User $actor): void
    {
        DB::transaction(function () use ($category, $actor): void {
            if ($category->companies()->exists()) {
                abort(422, __('diyar.b2b.category_has_companies'));
            }

            $before = $this->categorySnapshot($category);
            $category->delete();

            $this->audit->record(
                actor: $actor,
                action: 'b2b_category.delete',
                resource: $category,
                before: $before,
            );

            $this->cache->forget();
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function createTag(array $attributes, User $actor): B2bTag
    {
        return DB::transaction(function () use ($attributes, $actor): B2bTag {
            $tag = B2bTag::query()->create([
                'name' => $attributes['name'],
                'slug' => $this->b2b->generateTagSlug($attributes['name'], $attributes['slug'] ?? null),
            ]);

            $this->audit->record(
                actor: $actor,
                action: 'b2b_tag.create',
                resource: $tag,
                after: $this->tagSnapshot($tag),
            );

            $this->cache->forget();

            return $tag;
        });
    }

    /**
     * @param  array<string, mixed>  $extra
     */
    private function transitionCompany(
        B2bCompany $company,
        User $actor,
        B2bPublicationStatus $status,
        string $action,
        array $extra = [],
    ): B2bCompany {
        return DB::transaction(function () use ($company, $actor, $status, $action, $extra): B2bCompany {
            $before = $this->companySnapshot($company);
            $company->fill(array_merge(['publication_status' => $status], $extra))->save();
            $company->load(['category', 'tags']);

            $this->audit->record(
                actor: $actor,
                action: $action,
                resource: $company,
                before: $before,
                after: $this->companySnapshot($company),
            );

            $this->cache->forget();

            return $company;
        });
    }

    private function transitionVerification(
        B2bCompany $company,
        User $actor,
        B2bVerificationStatus $status,
        string $action,
    ): B2bCompany {
        return DB::transaction(function () use ($company, $actor, $status, $action): B2bCompany {
            $before = $this->companySnapshot($company);
            $company->update(['verification_status' => $status]);
            $company->load(['category', 'tags']);

            $this->audit->record(
                actor: $actor,
                action: $action,
                resource: $company,
                before: $before,
                after: $this->companySnapshot($company),
            );

            $this->cache->forget();

            return $company;
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function syncRelations(B2bCompany $company, array $attributes): void
    {
        if (array_key_exists('tag_ids', $attributes)) {
            $company->tags()->sync($attributes['tag_ids'] ?? []);
        }

        if (array_key_exists('project_ids', $attributes)) {
            $sync = [];
            foreach ($attributes['project_ids'] ?? [] as $index => $projectId) {
                $sync[$projectId] = ['sort_order' => $index];
            }
            $company->projects()->sync($sync);
        }

        if (array_key_exists('services', $attributes)) {
            $company->services()->delete();
            foreach ($attributes['services'] ?? [] as $index => $service) {
                B2bCompanyService::query()->create([
                    'b2b_company_id' => $company->id,
                    'name' => $service['name'],
                    'description' => $service['description'] ?? null,
                    'sort_order' => $index,
                ]);
            }
        }

        if (array_key_exists('testimonials', $attributes)) {
            $company->testimonials()->delete();
            foreach ($attributes['testimonials'] ?? [] as $index => $testimonial) {
                B2bCompanyTestimonial::query()->create([
                    'b2b_company_id' => $company->id,
                    'author_name' => $testimonial['author_name'],
                    'author_role' => $testimonial['author_role'] ?? null,
                    'rating' => $testimonial['rating'] ?? 5,
                    'content' => $testimonial['content'],
                    'sort_order' => $index,
                ]);
            }
        }
    }

    /** @return array<string, mixed> */
    private function companySnapshot(B2bCompany $company): array
    {
        return [
            'slug' => $company->slug,
            'name' => $company->name,
            'publication_status' => $company->publication_status->value,
            'verification_status' => $company->verification_status->value,
            'featured' => $company->featured,
            'b2b_category_id' => $company->b2b_category_id,
            'published_at' => $company->published_at?->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    private function categorySnapshot(B2bCategory $category): array
    {
        return [
            'slug' => $category->slug,
            'name' => $category->name,
        ];
    }

    /** @return array<string, mixed> */
    private function tagSnapshot(B2bTag $tag): array
    {
        return [
            'slug' => $tag->slug,
            'name' => $tag->name,
        ];
    }
}
