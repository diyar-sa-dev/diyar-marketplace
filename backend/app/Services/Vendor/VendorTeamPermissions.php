<?php

namespace App\Services\Vendor;

use App\Enums\VendorTeamRole;

final class VendorTeamPermissions
{
    /**
     * @return array<string, bool|string>
     */
    public static function matrix(VendorTeamRole $role): array
    {
        return match ($role) {
            VendorTeamRole::Owner => [
                'dashboard' => true,
                'orders' => 'write',
                'returns' => 'write',
                'products' => 'write',
                'products_delete' => true,
                'settings' => true,
                'team' => true,
                'reviews' => 'write',
                'chat' => true,
                'finance' => 'write',
                'finance_withdraw' => true,
            ],
            VendorTeamRole::Manager => [
                'dashboard' => true,
                'orders' => 'write',
                'returns' => 'write',
                'products' => 'write',
                'products_delete' => false,
                'finance' => 'read',
                'finance_withdraw' => false,
                'settings' => false,
                'team' => false,
                'reviews' => 'read',
                'chat' => false,
            ],
            VendorTeamRole::CustomerService => [
                'dashboard' => true,
                'orders' => 'read',
                'returns' => 'read',
                'products' => 'read',
                'products_delete' => false,
                'finance' => false,
                'finance_withdraw' => false,
                'settings' => false,
                'team' => false,
                'reviews' => 'reply',
                'chat' => true,
            ],
        };
    }

    public static function allows(VendorTeamRole $role, string $permission): bool
    {
        $value = self::matrix($role)[$permission] ?? false;

        if (is_bool($value)) {
            return $value;
        }

        return $value !== false && $value !== 'none';
    }

    public static function canWrite(VendorTeamRole $role, string $permission): bool
    {
        $value = self::matrix($role)[$permission] ?? false;

        return $value === true || $value === 'write';
    }

    public static function canReplyToReviews(VendorTeamRole $role): bool
    {
        $value = self::matrix($role)['reviews'] ?? false;

        return in_array($value, [true, 'write', 'reply'], true);
    }
}
