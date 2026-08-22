<?php

namespace App\Support\Identity;

use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Models\User;

final class MarketplaceAccess
{
    public static function hasActiveRole(User $user, RoleName $role): bool
    {
        $user->loadMissing('roles');

        return $user->roles->contains(function ($assigned) use ($role): bool {
            if ($assigned->name !== $role) {
                return false;
            }

            $status = $assigned->pivot->status ?? RoleStatus::Active;
            $statusValue = $status instanceof RoleStatus ? $status->value : (string) $status;

            return $statusValue === RoleStatus::Active->value;
        });
    }

    public static function hasPartnerPortalRole(User $user): bool
    {
        return self::hasActiveRole($user, RoleName::Vendor)
            || self::hasActiveRole($user, RoleName::Provider)
            || self::hasActiveRole($user, RoleName::Marketer);
    }

    /** Operations-only admin: no marketplace partner roles. */
    public static function isAdminOnlyAccount(User $user): bool
    {
        return self::hasActiveRole($user, RoleName::Admin)
            && ! self::hasPartnerPortalRole($user);
    }

    public static function canAccessMarketplace(User $user): bool
    {
        return ! self::isAdminOnlyAccount($user);
    }

    public static function canAccessAdminPanel(User $user): bool
    {
        return self::hasActiveRole($user, RoleName::Admin) && $user->isActive();
    }
}
