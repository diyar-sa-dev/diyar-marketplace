<?php

namespace App\Services\Admin;

use App\Models\Category;
use App\Models\User;
use App\Services\Catalog\CategoryService;
use Illuminate\Support\Facades\DB;

final class AdminCategoryService
{
    public function __construct(
        private readonly CategoryService $categories,
        private readonly AdminAuditService $audit,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes, User $actor): Category
    {
        return DB::transaction(function () use ($attributes, $actor): Category {
            $category = $this->categories->create($attributes);

            $this->audit->record(
                actor: $actor,
                action: 'category.create',
                resource: $category,
                after: $this->snapshot($category),
            );

            return $category;
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(Category $category, array $attributes, User $actor): Category
    {
        return DB::transaction(function () use ($category, $attributes, $actor): Category {
            $before = $this->snapshot($category);
            $updated = $this->categories->update($category, $attributes);

            $this->audit->record(
                actor: $actor,
                action: 'category.update',
                resource: $updated,
                before: $before,
                after: $this->snapshot($updated),
            );

            return $updated;
        });
    }

    public function delete(Category $category, User $actor): void
    {
        DB::transaction(function () use ($category, $actor): void {
            $before = $this->snapshot($category);
            $this->categories->delete($category);

            $this->audit->record(
                actor: $actor,
                action: 'category.delete',
                resource: $category,
                before: $before,
            );
        });
    }

    /** @return array<string, mixed> */
    private function snapshot(Category $category): array
    {
        return [
            'name' => $category->name,
            'slug' => $category->slug,
            'type' => $category->type->value,
            'parent_id' => $category->parent_id,
            'sort_order' => $category->sort_order,
            'is_active' => $category->is_active,
        ];
    }
}
