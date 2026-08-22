<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VendorAccount;

class VendorAccountPolicy
{
    public function view(User $user, VendorAccount $vendorAccount): bool
    {
        return $user->hasRole('vendor') && $vendorAccount->user_id === $user->id;
    }

    public function update(User $user, VendorAccount $vendorAccount): bool
    {
        return $this->view($user, $vendorAccount);
    }
}
