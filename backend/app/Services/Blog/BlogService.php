<?php

namespace App\Services\Blog;

use App\Models\BlogArticle;
use App\Models\BlogCategory;
use App\Models\BlogTag;
use App\Support\Content\HtmlContentSanitizer;
use App\Support\SlugGenerator;
use Illuminate\Support\Str;

final class BlogService
{
    public function __construct(
        private readonly HtmlContentSanitizer $sanitizer,
    ) {}

    public function generateSlug(string $title, ?string $provided = null, ?string $ignoreId = null): string
    {
        if ($provided !== null && $provided !== '') {
            return $this->uniqueSlug($provided, $ignoreId);
        }

        return $this->uniqueSlug($title, $ignoreId);
    }

    public function calculateReadingTimeMinutes(string $content): int
    {
        $text = trim(strip_tags($content));
        if ($text === '') {
            return 1;
        }

        $wordCount = count(preg_split('/\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY) ?: []);

        return max(1, (int) ceil($wordCount / 200));
    }

    public function sanitizeContent(?string $content): string
    {
        return $this->sanitizer->sanitize($content);
    }

    private function uniqueSlug(string $base, ?string $ignoreId = null): string
    {
        $slug = Str::slug($base);
        if ($slug === '') {
            $slug = Str::random(8);
        }

        $original = $slug;
        $counter = 1;

        while ($this->slugExists($slug, $ignoreId)) {
            $slug = $original.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    private function slugExists(string $slug, ?string $ignoreId = null): bool
    {
        $query = BlogArticle::query()->where('slug', $slug);

        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }

    public function generateCategorySlug(string $name, ?string $provided = null): string
    {
        if ($provided !== null && $provided !== '') {
            return SlugGenerator::unique($provided, new BlogCategory);
        }

        return SlugGenerator::unique($name, new BlogCategory);
    }

    public function generateTagSlug(string $name, ?string $provided = null): string
    {
        if ($provided !== null && $provided !== '') {
            return SlugGenerator::unique($provided, new BlogTag);
        }

        return SlugGenerator::unique($name, new BlogTag);
    }
}
