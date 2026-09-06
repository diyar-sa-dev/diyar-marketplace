<?php

namespace App\Services\B2b;

use App\Models\B2bCategory;
use App\Models\B2bCompany;
use App\Models\B2bTag;
use App\Support\Content\HtmlContentSanitizer;
use App\Support\SlugGenerator;
use Illuminate\Support\Str;

final class B2bService
{
    public function __construct(
        private readonly HtmlContentSanitizer $sanitizer,
    ) {}

    public function generateCompanySlug(string $name, ?string $provided = null, ?string $ignoreId = null): string
    {
        if ($provided !== null && $provided !== '') {
            return $this->uniqueCompanySlug($provided, $ignoreId);
        }

        return $this->uniqueCompanySlug($name, $ignoreId);
    }

    public function generateCategorySlug(string $name, ?string $provided = null): string
    {
        if ($provided !== null && $provided !== '') {
            return SlugGenerator::unique($provided, new B2bCategory);
        }

        return SlugGenerator::unique($name, new B2bCategory);
    }

    public function generateTagSlug(string $name, ?string $provided = null): string
    {
        if ($provided !== null && $provided !== '') {
            return SlugGenerator::unique($provided, new B2bTag);
        }

        return SlugGenerator::unique($name, new B2bTag);
    }

    public function sanitizeAbout(?string $content): ?string
    {
        if ($content === null || trim($content) === '') {
            return null;
        }

        return $this->sanitizer->sanitize($content);
    }

    public function formatTeamSizeLabel(?int $size): ?string
    {
        if ($size === null) {
            return null;
        }

        return match (true) {
            $size <= 10 => '1-10',
            $size <= 20 => '10-20',
            $size <= 50 => '20-50',
            $size <= 100 => '50-100',
            default => '100+',
        };
    }

    private function uniqueCompanySlug(string $base, ?string $ignoreId = null): string
    {
        $slug = Str::slug($base);
        if ($slug === '') {
            $slug = Str::random(8);
        }

        $original = $slug;
        $counter = 1;

        while ($this->companySlugExists($slug, $ignoreId)) {
            $slug = $original.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    private function companySlugExists(string $slug, ?string $ignoreId = null): bool
    {
        $query = B2bCompany::query()->withTrashed()->where('slug', $slug);

        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }
}
