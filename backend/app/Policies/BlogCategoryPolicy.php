<?php

namespace App\Policies;

use App\Enums\AdminPermission;
use App\Models\BlogCategory;
use App\Models\User;
use App\Services\Admin\AdminPermissionService;

class BlogCategoryPolicy
{
    public function __construct(
        private readonly AdminPermissionService $permissions,
    ) {}

    public function viewAny(User $user): bool
    {
        return $this->permissions->has($user, AdminPermission::BlogView);
    }

    public function view(User $user, BlogCategory $category): bool
    {
        return $this->permissions->has($user, AdminPermission::BlogView);
    }

    public function create(User $user): bool
    {
        return $this->permissions->has($user, AdminPermission::BlogManage);
    }

    public function update(User $user, BlogCategory $category): bool
    {
        return $this->permissions->has($user, AdminPermission::BlogManage);
    }

    public function delete(User $user, BlogCategory $category): bool
    {
        return $this->permissions->has($user, AdminPermission::BlogManage);
    }
}
