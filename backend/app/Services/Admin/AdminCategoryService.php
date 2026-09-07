<?php

namespace App\Services\Admin;

use App\Models\Category;
use App\Models\User;
use App\Services\Catalog\CategoryService;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class AdminCategoryService
{
    public function __construct(
        private readonly CategoryService $categories,
        private readonly AdminAuditService $audit,
        private readonly MediaUploadService $media,
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
            $this->media->deletePath($category->image_path);
            $this->categories->delete($category);

            $this->audit->record(
                actor: $actor,
                action: 'category.delete',
                resource: $category,
                before: $before,
            );
        });
    }

    public function uploadImage(Category $category, UploadedFile $file, User $actor): Category
    {
        return DB::transaction(function () use ($category, $file, $actor): Category {
            $before = $this->snapshot($category);
            $previousPath = $category->image_path;

            try {
                $path = $this->media->storeCategoryImage($category->id, $file);
            } catch (InvalidArgumentException $exception) {
                throw $exception;
            }

            $category->update(['image_path' => $path]);
            $this->media->deletePath($previousPath);

            $updated = $category->fresh();
            if ($updated === null) {
                throw new InvalidArgumentException(__('diyar.catalog.category_not_found'));
            }

            $this->audit->record(
                actor: $actor,
                action: 'category.image.upload',
                resource: $updated,
                before: $before,
                after: $this->snapshot($updated),
            );

            return $updated;
        });
    }

    public function deleteImage(Category $category, User $actor): Category
    {
        return DB::transaction(function () use ($category, $actor): Category {
            $before = $this->snapshot($category);
            $this->media->deletePath($category->image_path);
            $category->update(['image_path' => null]);

            $updated = $category->fresh();
            if ($updated === null) {
                throw new InvalidArgumentException(__('diyar.catalog.category_not_found'));
            }

            $this->audit->record(
                actor: $actor,
                action: 'category.image.delete',
                resource: $updated,
                before: $before,
                after: $this->snapshot($updated),
            );

            return $updated;
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
            'image_path' => $category->image_path,
        ];
    }
}
