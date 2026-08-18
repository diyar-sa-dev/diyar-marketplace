<?php

namespace App\Services\Vendor;

use App\Enums\RoleName;
use App\Enums\VendorTeamStatus;
use App\Models\Role;
use App\Models\User;
use App\Models\VendorTeamMember;

/**
 * Keeps the platform Vendor role aligned with store ownership and team memberships.
 *
 * - Store owners (vendor accounts) always retain Vendor.
 * - Team-only members receive Vendor on accept and lose it when removed from their last team,
 *   unless they already had Vendor before joining (registration / intrinsic role).
 */
final class VendorTeamRoleSync
{
    public function __construct(
        private readonly VendorAccessService $access,
    ) {}

    public function onMembershipActivated(User $user, VendorTeamMember $member): bool
    {
        $user->loadMissing(['roles', 'vendorAccount']);

        $hadVendorRole = $user->hasRole(RoleName::Vendor);
        $hadVendorAccount = $user->vendorAccount !== null;

        $this->access->ensureVendorRole($user);

        $user->unsetRelation('roles');
        $user->load('roles');

        $grantedNow = ! $hadVendorRole && ! $hadVendorAccount && $user->hasRole(RoleName::Vendor);

        if ($grantedNow) {
            $member->forceFill(['vendor_role_granted' => true])->save();
        }

        return $grantedNow;
    }

    public function onMembershipDeactivated(User $user): void
    {
        $user->loadMissing(['vendorAccount', 'roles']);

        if ($user->vendorAccount !== null) {
            return;
        }

        $hasActiveMembership = VendorTeamMember::query()
            ->where('user_id', $user->id)
            ->where('status', VendorTeamStatus::Active)
            ->exists();

        if ($hasActiveMembership) {
            return;
        }

        if (! $user->hasRole(RoleName::Vendor)) {
            return;
        }

        // Team-only vendors never own a store account. Registration vendors always have
        // vendorAccount, so reaching here means the role was team-granted or orphaned.
        $vendorRole = Role::query()->where('name', RoleName::Vendor->value)->first();

        if ($vendorRole === null) {
            return;
        }

        $user->roles()->detach($vendorRole->id);
        $user->unsetRelation('roles');
    }
}
