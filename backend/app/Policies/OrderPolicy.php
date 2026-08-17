<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Order $order): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $order->user_id === $user->id;
    }

    public function cancel(User $user, Order $order): bool
    {
        return $this->view($user, $order);
    }

    public function pay(User $user, Order $order): bool
    {
        return $this->view($user, $order);
    }
}
