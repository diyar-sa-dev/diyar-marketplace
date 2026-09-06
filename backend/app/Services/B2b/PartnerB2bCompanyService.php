<?php

namespace App\Services\B2b;

use App\Enums\B2bPublicationStatus;
use App\Enums\B2bVerificationStatus;
use App\Models\B2bCompany;
use App\Models\B2bCompanyPortfolioImage;
use App\Models\B2bCompanyService;
use App\Models\B2bTag;
use App\Models\User;
use App\Support\Cache\B2bCache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class PartnerB2bCompanyService
{
    public const MAX_PORTFOLIO_IMAGES = 6;

    public function __construct(
        private readonly B2bService $b2b,
        private readonly B2bCache $cache,
    ) {}

    public function findForVendor(User $user): ?B2bCompany
    {
        $vendorAccount = $user->vendorAccount;
        if ($vendorAccount === null) {
            return null;
        }

        return B2bCompany::query()
            ->with(['category', 'tags', 'services', 'portfolioImages'])
            ->where('vendor_account_id', $vendorAccount->id)
            ->first();
    }

    public function findForProvider(User $user): ?B2bCompany
    {
        $providerAccount = $user->providerAccount;
        if ($providerAccount === null) {
            return null;
        }

        return B2bCompany::query()
            ->with(['category', 'tags', 'services', 'portfolioImages'])
            ->where('provider_account_id', $providerAccount->id)
            ->first();
    }

    public function addPortfolioImageForVendor(User $user, string $imagePath): B2bCompany
    {
        $company = $this->findForVendor($user);
        if ($company === null) {
            abort(404, __('diyar.b2b.company_not_found'));
        }

        $this->assertCanManage($user, $company);

        return $this->storePortfolioImage($company, $imagePath);
    }

    public function addPortfolioImageForProvider(User $user, string $imagePath): B2bCompany
    {
        $company = $this->findForProvider($user);
        if ($company === null) {
            abort(404, __('diyar.b2b.company_not_found'));
        }

        $this->assertCanManage($user, $company);

        return $this->storePortfolioImage($company, $imagePath);
    }

    public function deletePortfolioImageForVendor(User $user, string $imageId): B2bCompany
    {
        $company = $this->findForVendor($user);
        if ($company === null) {
            abort(404, __('diyar.b2b.company_not_found'));
        }

        $this->assertCanManage($user, $company);

        return $this->removePortfolioImage($company, $imageId);
    }

    public function deletePortfolioImageForProvider(User $user, string $imageId): B2bCompany
    {
        $company = $this->findForProvider($user);
        if ($company === null) {
            abort(404, __('diyar.b2b.company_not_found'));
        }

        $this->assertCanManage($user, $company);

        return $this->removePortfolioImage($company, $imageId);
    }

    private function storePortfolioImage(B2bCompany $company, string $imagePath): B2bCompany
    {
        if ($company->portfolioImages()->count() >= self::MAX_PORTFOLIO_IMAGES) {
            throw new ConflictHttpException(__('diyar.b2b.portfolio_max_reached', [
                'max' => self::MAX_PORTFOLIO_IMAGES,
            ]));
        }

        return DB::transaction(function () use ($company, $imagePath): B2bCompany {
            $sortOrder = ((int) $company->portfolioImages()->max('sort_order')) + 1;

            B2bCompanyPortfolioImage::query()->create([
                'b2b_company_id' => $company->id,
                'image_path' => $imagePath,
                'sort_order' => $sortOrder,
            ]);

            $this->cache->forget();

            return $company->fresh(['category', 'tags', 'services', 'portfolioImages']);
        });
    }

    private function removePortfolioImage(B2bCompany $company, string $imageId): B2bCompany
    {
        $image = $company->portfolioImages()->whereKey($imageId)->first();
        if ($image === null) {
            abort(404, __('diyar.b2b.portfolio_image_not_found'));
        }

        return DB::transaction(function () use ($company, $image): B2bCompany {
            $image->delete();
            $this->cache->forget();

            return $company->fresh(['category', 'tags', 'services', 'portfolioImages']);
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function createForVendor(User $user, array $attributes): B2bCompany
    {
        $vendorAccount = $user->vendorAccount;
        if ($vendorAccount === null) {
            throw new AccessDeniedHttpException(__('diyar.b2b.vendor_account_required'));
        }

        if ($this->findForVendor($user) !== null) {
            throw new ConflictHttpException(__('diyar.b2b.company_already_linked'));
        }

        return $this->createLinkedCompany($user, $attributes, vendorAccountId: $vendorAccount->id);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function createForProvider(User $user, array $attributes): B2bCompany
    {
        $providerAccount = $user->providerAccount;
        if ($providerAccount === null) {
            throw new AccessDeniedHttpException(__('diyar.b2b.provider_account_required'));
        }

        if ($this->findForProvider($user) !== null) {
            throw new ConflictHttpException(__('diyar.b2b.company_already_linked'));
        }

        return $this->createLinkedCompany($user, $attributes, providerAccountId: $providerAccount->id);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function updateForVendor(User $user, array $attributes): B2bCompany
    {
        $company = $this->findForVendor($user);
        if ($company === null) {
            abort(404, __('diyar.b2b.company_not_found'));
        }

        $this->assertCanManage($user, $company);

        return $this->updateLinkedCompany($company, $attributes);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function updateForProvider(User $user, array $attributes): B2bCompany
    {
        $company = $this->findForProvider($user);
        if ($company === null) {
            abort(404, __('diyar.b2b.company_not_found'));
        }

        $this->assertCanManage($user, $company);

        return $this->updateLinkedCompany($company, $attributes);
    }

    public function assertCanManage(User $user, B2bCompany $company): void
    {
        $vendorAccountId = $user->vendorAccount?->id;
        $providerAccountId = $user->providerAccount?->id;

        $ownsVendorLink = $vendorAccountId !== null && $company->vendor_account_id === $vendorAccountId;
        $ownsProviderLink = $providerAccountId !== null && $company->provider_account_id === $providerAccountId;

        if (! $ownsVendorLink && ! $ownsProviderLink) {
            throw new AccessDeniedHttpException(__('diyar.b2b.company_manage_denied'));
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function createLinkedCompany(
        User $user,
        array $attributes,
        ?string $vendorAccountId = null,
        ?string $providerAccountId = null,
    ): B2bCompany {
        return DB::transaction(function () use ($user, $attributes, $vendorAccountId, $providerAccountId): B2bCompany {
            $slug = $this->b2b->generateCompanySlug(
                $attributes['name'],
                $attributes['slug'] ?? null,
            );

            $company = B2bCompany::query()->create([
                'b2b_category_id' => $attributes['b2b_category_id'] ?? null,
                'custom_category' => $attributes['custom_category'] ?? null,
                'owner_user_id' => $user->id,
                'vendor_account_id' => $vendorAccountId,
                'provider_account_id' => $providerAccountId,
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
                'business_hours' => $attributes['business_hours'] ?? null,
                'years_experience' => $attributes['years_experience'] ?? null,
                'team_size' => $attributes['team_size'] ?? null,
                'completed_projects' => $attributes['completed_projects'] ?? 0,
                'publication_status' => B2bPublicationStatus::Draft,
                'verification_status' => B2bVerificationStatus::Pending,
                'featured' => false,
            ]);

            $this->syncRelations($company, $attributes);
            $company->load(['category', 'tags', 'services', 'portfolioImages']);

            $this->cache->forget();

            return $company;
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function updateLinkedCompany(B2bCompany $company, array $attributes): B2bCompany
    {
        return DB::transaction(function () use ($company, $attributes): B2bCompany {
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

            if (! empty($attributes['custom_category'])) {
                $attributes['b2b_category_id'] = null;
            } elseif (array_key_exists('b2b_category_id', $attributes) && $attributes['b2b_category_id'] !== null) {
                $attributes['custom_category'] = null;
            }

            $company->fill([
                'b2b_category_id' => array_key_exists('b2b_category_id', $attributes)
                    ? $attributes['b2b_category_id']
                    : $company->b2b_category_id,
                'custom_category' => array_key_exists('custom_category', $attributes)
                    ? $attributes['custom_category']
                    : $company->custom_category,
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
                'business_hours' => $attributes['business_hours'] ?? $company->business_hours,
                'years_experience' => $attributes['years_experience'] ?? $company->years_experience,
                'team_size' => $attributes['team_size'] ?? $company->team_size,
                'completed_projects' => $attributes['completed_projects'] ?? $company->completed_projects,
            ])->save();

            $this->syncRelations($company, $attributes);
            $company->load(['category', 'tags', 'services', 'portfolioImages']);

            $this->cache->forget();

            return $company;
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function syncRelations(B2bCompany $company, array $attributes): void
    {
        if (array_key_exists('tag_ids', $attributes) || array_key_exists('tag_names', $attributes)) {
            $company->tags()->sync($this->resolveTagIds($attributes));
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
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return list<string>
     */
    private function resolveTagIds(array $attributes): array
    {
        $ids = collect($attributes['tag_ids'] ?? [])
            ->filter(fn ($id) => is_string($id) && $id !== '')
            ->values();

        foreach ($attributes['tag_names'] ?? [] as $name) {
            if (! is_string($name)) {
                continue;
            }

            $normalized = trim($name);
            if ($normalized === '') {
                continue;
            }

            $slug = Str::slug($normalized);
            if ($slug === '') {
                $slug = 'tag-'.substr(md5($normalized), 0, 12);
            }

            $tag = B2bTag::query()->firstOrCreate(
                ['slug' => $slug],
                ['name' => $normalized],
            );

            $ids->push($tag->id);
        }

        return $ids->unique()->values()->all();
    }
}
