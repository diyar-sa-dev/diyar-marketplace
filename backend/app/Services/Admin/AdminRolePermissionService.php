<?php

namespace App\Services\Admin;

use App\Enums\AdminPermission;
use App\Enums\RoleName;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class AdminRolePermissionService
{
    /** @var list<string> */
    private const PROTECTED_ADMIN_PERMISSIONS = [
        AdminPermission::PanelAccess->value,
        AdminPermission::RolesManage->value,
    ];

    public function __construct(
        private readonly AdminAuditService $audit,
        private readonly AdminPermissionService $permissions,
    ) {}

    /** @return Collection<int, string> */
    public function permissionKeysForRole(Role $role): Collection
    {
        return $role->permissions()->pluck('key');
    }

    /**
     * @param  list<string>  $permissionKeys
     */
    public function syncPermissions(Role $role, array $permissionKeys, User $actor): Role
    {
        if ($role->name !== RoleName::Admin) {
            throw new InvalidArgumentException(__('admin.errors.only_admin_role_manageable'));
        }

        $normalized = collect($permissionKeys)
            ->map(fn (string $key): string => trim($key))
            ->filter()
            ->unique()
            ->values();

        foreach (self::PROTECTED_ADMIN_PERMISSIONS as $required) {
            if (! $normalized->contains($required)) {
                $normalized->push($required);
            }
        }

        $validKeys = Permission::query()->pluck('key');
        $invalid = $normalized->diff($validKeys);

        if ($invalid->isNotEmpty()) {
            throw new InvalidArgumentException(__('admin.errors.invalid_permissions'));
        }

        return DB::transaction(function () use ($role, $normalized, $actor): Role {
            $before = $this->permissionKeysForRole($role)->all();
            $permissionIds = Permission::query()
                ->whereIn('key', $normalized)
                ->pluck('id');

            $role->permissions()->sync($permissionIds);
            $this->permissions->forgetAllAfterCommit();

            $this->audit->record(
                actor: $actor,
                action: 'role.permissions.sync',
                resource: $role,
                before: ['permissions' => $before],
                after: ['permissions' => $normalized->all()],
            );

            return $role->fresh(['permissions']);
        });
    }
}
