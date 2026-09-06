<?php

namespace App\Policies;

use App\Enums\AdminPermission;
use App\Models\BlogArticle;
use App\Models\User;
use App\Services\Admin\AdminPermissionService;

class BlogArticlePolicy
{
    public function __construct(
        private readonly AdminPermissionService $permissions,
    ) {}

    public function viewAny(User $user): bool
    {
        return $this->permissions->has($user, AdminPermission::BlogView);
    }

    public function view(User $user, BlogArticle $article): bool
    {
        return $this->permissions->has($user, AdminPermission::BlogView);
    }

    public function create(User $user): bool
    {
        return $this->permissions->has($user, AdminPermission::BlogManage);
    }

    public function update(User $user, BlogArticle $article): bool
    {
        return $this->permissions->has($user, AdminPermission::BlogManage);
    }

    public function delete(User $user, BlogArticle $article): bool
    {
        return $this->permissions->has($user, AdminPermission::BlogManage);
    }

    public function publish(User $user, BlogArticle $article): bool
    {
        return $this->permissions->has($user, AdminPermission::BlogManage);
    }

    public function unpublish(User $user, BlogArticle $article): bool
    {
        return $this->permissions->has($user, AdminPermission::BlogManage);
    }

    public function archive(User $user, BlogArticle $article): bool
    {
        return $this->permissions->has($user, AdminPermission::BlogManage);
    }
}
