<?php

namespace App\Services\Admin;

use App\Enums\ProviderAccountStatus;
use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Enums\UserStatus;
use App\Enums\VendorAccountStatus;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class AdminUserService
{
    public function __construct(
        private readonly AdminAuditService $audit,
    ) {}

    public function suspend(User $user, User $actor, ?string $reason = null): User
    {
        $this->assertCanMutate($user, $actor);

        if ($user->status === UserStatus::Suspended) {
            return $user;
        }

        return DB::transaction(function () use ($user, $actor, $reason): User {
            $before = ['status' => $user->status->value];
            $user->status = UserStatus::Suspended;
            $user->save();

            $this->audit->record(
                actor: $actor,
                action: 'user.suspend',
                resource: $user,
                before: $before,
                after: ['status' => $user->status->value],
                reason: $reason,
            );

            return $user->fresh(['roles']);
        });
    }

    public function activate(User $user, User $actor, ?string $reason = null): User
    {
        $this->assertCanMutate($user, $actor);

        if ($user->status === UserStatus::Active) {
            return $user;
        }

        return DB::transaction(function () use ($user, $actor, $reason): User {
            $before = ['status' => $user->status->value];
            $user->status = UserStatus::Active;
            $user->save();

            $this->audit->record(
                actor: $actor,
                action: 'user.activate',
                resource: $user,
                before: $before,
                after: ['status' => $user->status->value],
                reason: $reason,
            );

            return $user->fresh(['roles']);
        });
    }

    public function assignRole(User $user, RoleName $roleName, User $actor): User
    {
        if ($actor->id === $user->id && $roleName === RoleName::Admin) {
            throw new InvalidArgumentException(__('admin.errors.cannot_self_escalate'));
        }

        return DB::transaction(function () use ($user, $roleName, $actor): User {
            $role = Role::query()->where('name', $roleName)->firstOrFail();

            if ($user->roles()->where('roles.id', $role->id)->exists()) {
                $user->roles()->updateExistingPivot($role->id, [
                    'status' => RoleStatus::Active->value,
                ]);
            } else {
                $user->roles()->attach($role->id, [
                    'status' => RoleStatus::Active->value,
                ]);
            }

            if ($roleName === RoleName::Vendor && $user->vendorAccount()->doesntExist()) {
                $user->vendorAccount()->create([
                    'business_name' => $user->name,
                    'status' => VendorAccountStatus::Active,
                ]);
            }

            if ($roleName === RoleName::Provider && $user->providerAccount()->doesntExist()) {
                $user->providerAccount()->create([
                    'business_name' => $user->name,
                    'status' => ProviderAccountStatus::Active,
                ]);
            }

            $this->audit->record(
                actor: $actor,
                action: 'user.role.assign',
                resource: $user,
                after: ['role' => $roleName->value],
            );

            app(AdminPermissionService::class)->forget($user);

            return $user->fresh(['roles']);
        });
    }

    public function revokeRole(User $user, RoleName $roleName, User $actor): User
    {
        if ($roleName === RoleName::Admin) {
            $this->assertAdminAuthorityPreserved($user);
        }

        return DB::transaction(function () use ($user, $roleName, $actor): User {
            $role = Role::query()->where('name', $roleName)->firstOrFail();
            $user->roles()->detach($role->id);

            $this->audit->record(
                actor: $actor,
                action: 'user.role.revoke',
                resource: $user,
                after: ['role' => $roleName->value],
            );

            app(AdminPermissionService::class)->forget($user);

            return $user->fresh(['roles']);
        });
    }

    private function assertCanMutate(User $user, User $actor): void
    {
        if ($actor->id === $user->id) {
            throw new InvalidArgumentException(__('admin.errors.cannot_mutate_self'));
        }

        if ($user->hasRole(RoleName::Admin)) {
            $this->assertAdminAuthorityPreserved($user);
        }
    }

    private function assertAdminAuthorityPreserved(User $user): void
    {
        $remainingAdmins = User::query()
            ->where('status', UserStatus::Active)
            ->where('id', '!=', $user->id)
            ->whereHas('roles', fn ($query) => $query->where('name', RoleName::Admin))
            ->count();

        if ($remainingAdmins < 1) {
            throw new InvalidArgumentException(__('admin.errors.last_admin_protected'));
        }
    }
}
