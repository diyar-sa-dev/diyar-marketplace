<?php

namespace App\Support\Cache;

use Illuminate\Support\Facades\Cache;

final class BlogProjectCache
{
    private const TTL_MINUTES = 15;

    /**
     * @param  array<string, mixed>  $filters
     */
    public function blogArticlesListKey(array $filters): string
    {
        return 'diyar:blog:v'.$this->blogVersion().':articles:list:'.md5(json_encode($filters));
    }

    public function blogArticleDetailKey(string $slug): string
    {
        return 'diyar:blog:v'.$this->blogVersion().':articles:show:'.$slug;
    }

    public function blogCategoriesKey(): string
    {
        return 'diyar:blog:v'.$this->blogVersion().':categories';
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function blogTagArticlesKey(string $slug, array $filters): string
    {
        return 'diyar:blog:v'.$this->blogVersion().':tags:'.$slug.':articles:'.md5(json_encode($filters));
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function projectsListKey(array $filters): string
    {
        return 'diyar:projects:v'.$this->projectsVersion().':list:'.md5(json_encode($filters));
    }

    public function projectDetailKey(string $slug): string
    {
        return 'diyar:projects:v'.$this->projectsVersion().':show:'.$slug;
    }

    public function ttl(): \DateTimeInterface
    {
        return now()->addMinutes(self::TTL_MINUTES);
    }

    public function forgetBlog(): void
    {
        Cache::increment('diyar:blog:cache-v');
    }

    public function forgetProjects(): void
    {
        Cache::increment('diyar:projects:cache-v');
    }

    public function forgetAll(): void
    {
        $this->forgetBlog();
        $this->forgetProjects();
    }

    private function blogVersion(): int
    {
        return (int) Cache::get('diyar:blog:cache-v', 0);
    }

    private function projectsVersion(): int
    {
        return (int) Cache::get('diyar:projects:cache-v', 0);
    }
}
