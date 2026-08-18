<?php

namespace App\Services\ServiceMarketplace;

use App\Models\ServiceCategory;
use Illuminate\Support\Collection;

final class ServiceCategoryService
{
    /**
     * @return Collection<int, ServiceCategory>
     */
    public function listActive(): Collection
    {
        return ServiceCategory::query()
            ->active()
            ->orderBy('sort_order')
            ->orderBy('name_ar')
            ->get();
    }

    public function findActiveBySlug(string $slug): ?ServiceCategory
    {
        return ServiceCategory::query()
            ->active()
            ->where('slug', $slug)
            ->first();
    }
}
