<?php

namespace App\Policies;

use App\Models\ProviderAccount;
use App\Models\User;

class ProviderAccountPolicy
{
    public function view(User $user, ProviderAccount $providerAccount): bool
    {
        return $user->hasRole('provider') && $providerAccount->user_id === $user->id;
    }
}
