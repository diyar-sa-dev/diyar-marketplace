<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VendorOrder;

class VendorOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('vendor') || $user->hasRole('admin');
    }

    public function view(User $user, VendorOrder $vendorOrder): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        $vendorAccount = $user->vendorAccount;

        return $vendorAccount !== null
            && $vendorOrder->vendor_account_id === $vendorAccount->id;
    }

    public function accept(User $user, VendorOrder $vendorOrder): bool
    {
        return $this->view($user, $vendorOrder);
    }

    public function process(User $user, VendorOrder $vendorOrder): bool
    {
        return $this->view($user, $vendorOrder);
    }

    public function ship(User $user, VendorOrder $vendorOrder): bool
    {
        return $this->view($user, $vendorOrder);
    }

    public function deliver(User $user, VendorOrder $vendorOrder): bool
    {
        return $this->view($user, $vendorOrder);
    }

    public function cancel(User $user, VendorOrder $vendorOrder): bool
    {
        return $this->view($user, $vendorOrder);
    }

    public function create(User $user): bool
    {
        return $user->hasRole('vendor') && $user->vendorAccount !== null;
    }
}
