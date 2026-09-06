<?php

namespace App\Policies;

use App\Enums\AdminPermission;
use App\Models\B2bLead;
use App\Models\User;
use App\Services\Admin\AdminPermissionService;

class B2bLeadPolicy
{
    public function __construct(
        private readonly AdminPermissionService $permissions,
    ) {}

    public function viewAny(User $user): bool
    {
        return $this->permissions->has($user, AdminPermission::B2bLeadsView);
    }

    public function view(User $user, B2bLead $lead): bool
    {
        if ($this->permissions->has($user, AdminPermission::B2bLeadsView)) {
            return true;
        }

        return $lead->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }
}
