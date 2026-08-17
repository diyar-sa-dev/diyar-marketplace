<?php

namespace App\Policies;

use App\Models\User;

class VendorShippingSettingsPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('vendor') || $user->hasRole('admin');
    }

    public function view(User $user): bool
    {
        return $this->viewAny($user) && $user->vendorAccount !== null;
    }

    public function update(User $user): bool
    {
        return $this->view($user);
    }
}
