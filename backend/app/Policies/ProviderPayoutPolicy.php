<?php

namespace App\Policies;

use App\Models\User;

class ProviderPayoutPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin');
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
