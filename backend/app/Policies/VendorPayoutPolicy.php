<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VendorPayout;

class VendorPayoutPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('vendor') || $user->hasRole('admin');
    }

    public function view(User $user, VendorPayout $payout): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        $vendorAccount = $user->vendorAccount;

        return $vendorAccount !== null && $payout->vendor_account_id === $vendorAccount->id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('vendor') && $user->vendorAccount !== null;
    }

    public function cancel(User $user, VendorPayout $payout): bool
    {
        return $this->view($user, $payout);
    }

    public function approve(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function reject(User $user): bool
    {
        return $user->hasRole('admin');
    }

    public function markPaid(User $user): bool
    {
        return $user->hasRole('admin');
    }
}
