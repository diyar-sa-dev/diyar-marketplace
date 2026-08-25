<?php

namespace App\Services\Projects;

use App\Models\Project;
use Illuminate\Support\Str;

final class ProjectService
{
    public function generateSlug(string $title, ?string $provided = null, ?string $ignoreId = null): string
    {
        if ($provided !== null && $provided !== '') {
            return $this->uniqueSlug($provided, $ignoreId);
        }

        return $this->uniqueSlug($title, $ignoreId);
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
        $query = Project::query()->where('slug', $slug);

        if ($ignoreId !== null) {
            $query->where('id', '!=', $ignoreId);
        }

        return $query->exists();
    }
}
