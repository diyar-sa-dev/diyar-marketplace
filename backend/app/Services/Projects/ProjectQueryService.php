<?php

namespace App\Services\Projects;

use App\Models\Project;
use App\Support\Cache\BlogProjectCache;
use App\Support\Cache\CachesQueryResults;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class ProjectQueryService
{
    /** @var list<string> */
    private const LISTING_COLUMNS = [
        'id',
        'slug',
        'title',
        'description',
        'category',
        'location',
        'year',
        'cover_image',
        'published_at',
        'status',
    ];

    public function __construct(
        private readonly BlogProjectCache $cache,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listPublished(array $filters = []): LengthAwarePaginator
    {
        $cacheKey = $this->cache->projectsListKey($filters);

        return CachesQueryResults::rememberPaginator(
            $cacheKey,
            $this->cache->ttl(),
            function () use ($filters) {
                $query = $this->publishedQuery()
                    ->select(self::LISTING_COLUMNS)
                    ->withCount('images');

                $this->applyFilters($query, $filters);
                $this->applySort($query, (string) ($filters['sort'] ?? 'latest'));

                return $query->paginate($this->resolvePerPage($filters));
            },
            Project::class,
        );
    }

    public function findPublishedBySlug(string $slug): Project
    {
        $cacheKey = $this->cache->projectDetailKey($slug);

        $project = CachesQueryResults::rememberModel(
            $cacheKey,
            $this->cache->ttl(),
            fn () => $this->publishedQuery()
                ->with(['images'])
                ->where('slug', $slug)
                ->first(),
            Project::class,
            ['images'],
        );

        if ($project === null) {
            throw new NotFoundHttpException(__('diyar.projects.not_found'));
        }

        return $project;
    }

    /**
     * @return Builder<Project>
     */
    private function publishedQuery(): Builder
    {
        return Project::query()->published();
    }

    /**
     * @param  Builder<Project>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['category'])) {
            $query->where('category', (string) $filters['category']);
        }

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function (Builder $q) use ($term): void {
                $q->where('title', 'like', $term)
                    ->orWhere('description', 'like', $term)
                    ->orWhere('location', 'like', $term);
            });
        }
    }

    /**
     * @param  Builder<Project>  $query
     */
    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'oldest' => $query->orderBy('published_at'),
            'year' => $query->orderByDesc('year'),
            default => $query->orderByDesc('published_at'),
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
