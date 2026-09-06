<?php

namespace App\Policies;

use App\Enums\AdminPermission;
use App\Models\Project;
use App\Models\User;
use App\Services\Admin\AdminPermissionService;

class ProjectPolicy
{
    public function __construct(
        private readonly AdminPermissionService $permissions,
    ) {}

    public function viewAny(User $user): bool
    {
        return $this->permissions->has($user, AdminPermission::ProjectsView);
    }

    public function view(User $user, Project $project): bool
    {
        return $this->permissions->has($user, AdminPermission::ProjectsView);
    }

    public function create(User $user): bool
    {
        return $this->permissions->has($user, AdminPermission::ProjectsManage);
    }

    public function update(User $user, Project $project): bool
    {
        return $this->permissions->has($user, AdminPermission::ProjectsManage);
    }

    public function delete(User $user, Project $project): bool
    {
        return $this->permissions->has($user, AdminPermission::ProjectsManage);
    }

    public function publish(User $user, Project $project): bool
    {
        return $this->permissions->has($user, AdminPermission::ProjectsManage);
    }

    public function unpublish(User $user, Project $project): bool
    {
        return $this->permissions->has($user, AdminPermission::ProjectsManage);
    }

    public function archive(User $user, Project $project): bool
    {
        return $this->permissions->has($user, AdminPermission::ProjectsManage);
    }
}
