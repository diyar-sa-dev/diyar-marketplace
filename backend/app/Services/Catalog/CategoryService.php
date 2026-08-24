<?php

namespace App\Services\Catalog;

use App\Enums\CategoryType;
use App\Models\Category;
use App\Support\SlugGenerator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class CategoryService
{
    /**
     * @return Collection<int, Category>
     */
    public function listActiveTree(?string $type = null): Collection
    {
        $cacheKey = 'marketplace:catalog:categories:tree:'.($type ?? 'all');
        $ttl = (int) config('diyar.catalog.category_tree_seconds', 900);

        return Cache::remember($cacheKey, $ttl, function () use ($type) {
            $query = Category::query()
                ->active()
                ->roots()
                ->ordered();

            if ($type !== null && $type !== '') {
                $query->where('type', $type);
            }

            return $query
                ->with(['children' => fn ($q) => $q->active()->ordered()])
                ->get();
        });
    }

    /**
     * @return Collection<int, Category>
     */
    public function listAll(): Collection
    {
        return Category::query()->ordered()->with('parent')->get();
    }

    public function findActiveBySlug(string $slug): Category
    {
        $category = Category::query()
            ->where('slug', $slug)
            ->active()
            ->first();

        if ($category === null) {
            throw new NotFoundHttpException(__('diyar.catalog.category_not_found'));
        }

        return $category;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Category
    {
        $category = DB::transaction(function () use ($attributes) {
            $slug = $attributes['slug'] ?? SlugGenerator::unique(
                $attributes['name'],
                new Category,
            );

            return Category::query()->create([
                'parent_id' => $attributes['parent_id'] ?? null,
                'name' => $attributes['name'],
                'slug' => $slug,
                'type' => $attributes['type'] ?? CategoryType::Product->value,
                'sort_order' => $attributes['sort_order'] ?? 0,
                'is_active' => $attributes['is_active'] ?? true,
            ]);
        });

        $this->forgetTreeCache();

        return $category;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Category $category, array $attributes): Category
    {
        return DB::transaction(function () use ($category, $attributes) {
            if (array_key_exists('name', $attributes) && ! array_key_exists('slug', $attributes)) {
                $attributes['slug'] = SlugGenerator::unique(
                    $attributes['name'],
                    new Category,
                );
            }

            if (array_key_exists('parent_id', $attributes) && $attributes['parent_id'] === $category->id) {
                $attributes['parent_id'] = $category->parent_id;
            }

            $category->fill([
                'parent_id' => $attributes['parent_id'] ?? $category->parent_id,
                'name' => $attributes['name'] ?? $category->name,
                'slug' => $attributes['slug'] ?? $category->slug,
                'type' => $attributes['type'] ?? $category->type,
                'sort_order' => $attributes['sort_order'] ?? $category->sort_order,
                'is_active' => $attributes['is_active'] ?? $category->is_active,
            ])->save();

            $this->forgetTreeCache();

            return $category->fresh(['parent', 'children']);
        });
    }

    public function forgetTreeCache(): void
    {
        Cache::forget('marketplace:catalog:categories:tree:all');
        Cache::forget('marketplace:catalog:categories:tree:product');
        Cache::forget('marketplace:catalog:categories:tree:service');
    }

    public function delete(Category $category): void
    {
        if ($category->products()->exists()) {
            abort(422, __('diyar.catalog.category_has_products'));
        }

        $category->delete();
        $this->forgetTreeCache();
    }
}
