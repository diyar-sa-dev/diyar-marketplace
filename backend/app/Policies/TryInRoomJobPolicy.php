<?php

namespace App\Policies;

use App\Models\TryInRoomJob;
use App\Models\User;

class TryInRoomJobPolicy
{
    public function view(User $user, TryInRoomJob $job): bool
    {
        return $job->user_id === $user->id;
    }
}
