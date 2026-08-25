<?php

namespace App\Services\B2b;

use App\Enums\B2bVerificationStatus;
use App\Models\B2bCategory;
use App\Models\B2bCompany;
use App\Support\Cache\B2bCache;
use App\Support\Cache\CachesQueryResults;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class B2bQueryService
{
    /** @var list<string> */
    private const LISTING_COLUMNS = [
        'id',
        'b2b_category_id',
        'slug',
        'name',
        'description',
        'logo',
        'cover_image',
        'location',
        'rating',
        'reviews_count',
        'verification_status',
        'featured',
        'published_at',
    ];

    public function __construct(
        private readonly B2bCache $cache,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listPublished(array $filters = []): LengthAwarePaginator
    {
        $cacheKey = $this->cache->companiesListKey($filters);

        return CachesQueryResults::rememberPaginator(
            $cacheKey,
            $this->cache->ttl(),
            function () use ($filters) {
                $query = $this->publishedQuery()
                    ->select(self::LISTING_COLUMNS)
                    ->with(['category', 'tags']);

                $this->applyFilters($query, $filters);
                $this->applySort($query, (string) ($filters['sort'] ?? 'featured'));

                return $query->paginate($this->resolvePerPage($filters));
            },
            B2bCompany::class,
            ['category', 'tags'],
        );
    }

    public function findPublishedBySlug(string $slug): B2bCompany
    {
        $cacheKey = $this->cache->companyDetailKey($slug);

        $company = CachesQueryResults::rememberModel(
            $cacheKey,
            $this->cache->ttl(),
            fn () => $this->publishedQuery()
                ->with([
                    'category',
                    'tags',
                    'services',
                    'testimonials',
                    'projects' => fn ($q) => $q->published()->with('images'),
                ])
                ->where('slug', $slug)
                ->first(),
            B2bCompany::class,
            ['category', 'tags', 'services', 'testimonials', 'projects'],
        );

        if ($company === null) {
            throw new NotFoundHttpException(__('diyar.b2b.company_not_found'));
        }

        return $company;
    }

    /**
     * @return Collection<int, B2bCategory>
     */
    public function listCategories(): Collection
    {
        $cacheKey = $this->cache->categoriesKey();

        return CachesQueryResults::rememberCollection(
            $cacheKey,
            $this->cache->ttl(),
            fn () => B2bCategory::query()
                ->orderBy('name')
                ->withCount(['companies as published_companies_count' => fn (Builder $q) => $q->published()])
                ->get(),
            B2bCategory::class,
        );
    }

    /**
     * @return Collection<int, B2bCompany>
     */
    public function relatedPublished(B2bCompany $company, int $limit = 3): Collection
    {
        $limit = min(max($limit, 1), 6);
        $company->loadMissing(['category', 'tags']);
        $tagIds = $company->tags->pluck('id');

        $query = $this->publishedQuery()
            ->select(self::LISTING_COLUMNS)
            ->with(['category', 'tags'])
            ->where('id', '!=', $company->id)
            ->where(function (Builder $q) use ($company, $tagIds): void {
                if ($company->b2b_category_id !== null) {
                    $q->where('b2b_category_id', $company->b2b_category_id);
                }

                if ($tagIds->isNotEmpty()) {
                    if ($company->b2b_category_id !== null) {
                        $q->orWhereHas('tags', fn (Builder $tagQuery) => $tagQuery->whereIn('b2b_tags.id', $tagIds));
                    } else {
                        $q->whereHas('tags', fn (Builder $tagQuery) => $tagQuery->whereIn('b2b_tags.id', $tagIds));
                    }
                }
            })
            ->orderByDesc('featured')
            ->orderByDesc('rating')
            ->limit($limit);

        return $query->get();
    }

    /**
     * @return array{verified_companies: int, published_companies: int}
     */
    public function directoryStats(): array
    {
        $cacheKey = $this->cache->directoryStatsKey();

        return Cache::remember($cacheKey, $this->cache->ttl(), fn () => [
            'verified_companies' => B2bCompany::query()
                ->published()
                ->where('verification_status', B2bVerificationStatus::Verified)
                ->count(),
            'published_companies' => B2bCompany::query()->published()->count(),
        ]);
    }

    /**
     * @return Builder<B2bCompany>
     */
    private function publishedQuery(): Builder
    {
        return B2bCompany::query()->published();
    }

    /**
     * @param  Builder<B2bCompany>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['category'])) {
            $categorySlug = (string) $filters['category'];
            $query->whereHas('category', fn (Builder $q) => $q->where('slug', $categorySlug));
        }

        if (! empty($filters['location'])) {
            $location = '%'.(string) $filters['location'].'%';
            $query->where('location', 'like', $location);
        }

        if (array_key_exists('verified', $filters) && $filters['verified'] !== null && $filters['verified'] !== '') {
            if (filter_var($filters['verified'], FILTER_VALIDATE_BOOLEAN)) {
                $query->where('verification_status', B2bVerificationStatus::Verified);
            }
        }

        if (array_key_exists('featured', $filters) && $filters['featured'] !== null && $filters['featured'] !== '') {
            if (filter_var($filters['featured'], FILTER_VALIDATE_BOOLEAN)) {
                $query->where('featured', true);
            }
        }

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function (Builder $q) use ($term): void {
                $q->where('name', 'like', $term)
                    ->orWhere('description', 'like', $term)
                    ->orWhere('location', 'like', $term);
            });
        }
    }

    /**
     * @param  Builder<B2bCompany>  $query
     */
    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'rating' => $query->orderByDesc('rating')->orderByDesc('reviews_count'),
            'newest' => $query->orderByDesc('published_at'),
            'name' => $query->orderBy('name'),
            default => $query->orderByDesc('featured')->orderByDesc('rating')->orderByDesc('published_at'),
        };
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function resolvePerPage(array $filters): int
    {
        return min(max((int) ($filters['per_page'] ?? 12), 1), 48);
    }
}
