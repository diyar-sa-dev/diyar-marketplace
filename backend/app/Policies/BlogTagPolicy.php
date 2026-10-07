<?php

namespace App\Policies;

use App\Domains\Admin\Services\AdminPermissionService;
use App\Enums\AdminPermission;
use App\Models\BlogTag;
use App\Models\User;

class BlogTagPolicy
{
    public function __construct(
        private readonly AdminPermissionService $permissions,
    ) {}

    public function viewAny(User $user): bool
    {
        return $this->permissions->has($user, AdminPermission::BlogView);
    }

    public function view(User $user, BlogTag $tag): bool
    {
        return $this->permissions->has($user, AdminPermission::BlogView);
    }

    public function create(User $user): bool
    {
        return $this->permissions->has($user, AdminPermission::BlogManage);
    }

    public function update(User $user, BlogTag $tag): bool
    {
        return $this->permissions->has($user, AdminPermission::BlogManage);
    }

    public function delete(User $user, BlogTag $tag): bool
    {
        return $this->permissions->has($user, AdminPermission::BlogManage);
    }
}
