<?php

namespace App\Services\Vendor;

use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Enums\VendorTeamRole;
use App\Enums\VendorTeamStatus;
use App\Models\Role;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorTeamMember;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final class VendorAccessService
{
    public function resolveVendorAccount(User $user): ?VendorAccount
    {
        $user->loadMissing('vendorAccount');

        if ($user->vendorAccount !== null) {
            return $user->vendorAccount;
        }

        $membership = VendorTeamMember::query()
            ->where('user_id', $user->id)
            ->where('status', VendorTeamStatus::Active)
            ->with('vendorAccount')
            ->orderByDesc('accepted_at')
            ->first();

        return $membership?->vendorAccount;
    }

    public function resolveRole(User $user): ?VendorTeamRole
    {
        $user->loadMissing('vendorAccount');

        if ($user->vendorAccount !== null) {
            return VendorTeamRole::Owner;
        }

        $membership = VendorTeamMember::query()
            ->where('user_id', $user->id)
            ->where('status', VendorTeamStatus::Active)
            ->orderByDesc('accepted_at')
            ->first();

        return $membership?->role;
    }

    public function requireVendorAccount(User $user): VendorAccount
    {
        $vendorAccount = $this->resolveVendorAccount($user);

        if ($vendorAccount === null) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        return $vendorAccount;
    }

    public function requireOwner(User $user): VendorAccount
    {
        $user->loadMissing('vendorAccount');

        if ($user->vendorAccount === null) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        return $user->vendorAccount;
    }

    public function assertPermission(User $user, string $permission): VendorAccount
    {
        $role = $this->resolveRole($user);
        $vendorAccount = $this->requireVendorAccount($user);

        if ($role === null || ! VendorTeamPermissions::allows($role, $permission)) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        return $vendorAccount;
    }

    public function allows(User $user, string $permission): bool
    {
        $role = $this->resolveRole($user);

        return $role !== null && VendorTeamPermissions::allows($role, $permission);
    }

    public function canWrite(User $user, string $permission): bool
    {
        $role = $this->resolveRole($user);

        return $role !== null && VendorTeamPermissions::canWrite($role, $permission);
    }

    public function assertWritePermission(User $user, string $permission): VendorAccount
    {
        $vendorAccount = $this->assertPermission($user, $permission);

        if (! $this->canWrite($user, $permission)) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        return $vendorAccount;
    }

    /**
     * @return array{role: string, permissions: array<string, bool|string>, vendor_account_id: string}
     */
    public function accessPayload(User $user): array
    {
        $vendorAccount = $this->resolveVendorAccount($user);
        $role = $this->resolveRole($user);

        if ($vendorAccount === null || $role === null) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        return [
            'role' => $role->value,
            'permissions' => VendorTeamPermissions::matrix($role),
            'vendor_account_id' => $vendorAccount->id,
        ];
    }

    public function activeMembership(User $user): ?VendorTeamMember
    {
        return VendorTeamMember::query()
            ->where('user_id', $user->id)
            ->where('status', VendorTeamStatus::Active)
            ->with('vendorAccount')
            ->first();
    }

    public function ensureVendorRole(User $user): void
    {
        $user->loadMissing(['roles', 'vendorAccount']);

        if ($user->hasRole(RoleName::Vendor) || $user->vendorAccount !== null) {
            return;
        }

        $role = Role::query()->where('name', RoleName::Vendor->value)->first();

        if ($role === null) {
            return;
        }

        if ($user->roles()->where('roles.id', $role->id)->exists()) {
            $user->unsetRelation('roles');

            return;
        }

        $user->roles()->attach($role->id, [
            'id' => (string) str()->uuid(),
            'status' => RoleStatus::Active->value,
        ]);

        $user->unsetRelation('roles');
    }
}
