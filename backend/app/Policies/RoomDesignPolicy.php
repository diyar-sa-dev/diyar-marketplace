<?php

namespace App\Policies;

use App\Models\RoomDesign;
use App\Models\User;

class RoomDesignPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, RoomDesign $roomDesign): bool
    {
        return $roomDesign->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, RoomDesign $roomDesign): bool
    {
        return $roomDesign->user_id === $user->id;
    }

    public function delete(User $user, RoomDesign $roomDesign): bool
    {
        return $roomDesign->user_id === $user->id;
    }
}
