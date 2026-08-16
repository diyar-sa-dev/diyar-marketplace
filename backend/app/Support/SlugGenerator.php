<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

final class SlugGenerator
{
    public static function unique(string $base, Model $model, string $column = 'slug', ?string $scopeColumn = null, mixed $scopeValue = null): string
    {
        $slug = Str::slug($base);
        if ($slug === '') {
            $slug = Str::random(8);
        }

        $original = $slug;
        $counter = 1;

        while (self::exists($model, $column, $slug, $scopeColumn, $scopeValue)) {
            $slug = $original.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    private static function exists(Model $model, string $column, string $slug, ?string $scopeColumn, mixed $scopeValue): bool
    {
        $query = $model->newQuery()->where($column, $slug);

        if ($scopeColumn !== null) {
            $query->where($scopeColumn, $scopeValue);
        }

        return $query->exists();
    }
}
