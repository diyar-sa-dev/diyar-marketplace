<?php

namespace App\Policies;

use App\Enums\AdminPermission;
use App\Models\B2bCompany;
use App\Models\User;
use App\Services\Admin\AdminPermissionService;

class B2bCompanyPolicy
{
    public function __construct(
        private readonly AdminPermissionService $permissions,
    ) {}

    public function viewAny(User $user): bool
    {
        return $this->permissions->has($user, AdminPermission::B2bView);
    }

    public function view(User $user, B2bCompany $company): bool
    {
        return $this->permissions->has($user, AdminPermission::B2bView);
    }

    public function create(User $user): bool
    {
        return $this->permissions->has($user, AdminPermission::B2bManage);
    }

    public function update(User $user, B2bCompany $company): bool
    {
        return $this->permissions->has($user, AdminPermission::B2bManage);
    }

    public function delete(User $user, B2bCompany $company): bool
    {
        return $this->permissions->has($user, AdminPermission::B2bManage);
    }

    public function publish(User $user, B2bCompany $company): bool
    {
        return $this->permissions->has($user, AdminPermission::B2bManage);
    }

    public function unpublish(User $user, B2bCompany $company): bool
    {
        return $this->permissions->has($user, AdminPermission::B2bManage);
    }

    public function archive(User $user, B2bCompany $company): bool
    {
        return $this->permissions->has($user, AdminPermission::B2bManage);
    }

    public function verify(User $user, B2bCompany $company): bool
    {
        return $this->permissions->has($user, AdminPermission::B2bManage);
    }

    public function feature(User $user, B2bCompany $company): bool
    {
        return $this->permissions->has($user, AdminPermission::B2bManage);
    }
}
