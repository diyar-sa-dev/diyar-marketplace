<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin') || $user->hasRole('vendor');
    }

    public function view(User $user, Product $product): bool
    {
        return $this->ownsOrAdmin($user, $product);
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin') || $user->hasRole('vendor');
    }

    public function update(User $user, Product $product): bool
    {
        return $this->ownsOrAdmin($user, $product);
    }

    public function delete(User $user, Product $product): bool
    {
        return $this->ownsOrAdmin($user, $product);
    }

    private function ownsOrAdmin(User $user, Product $product): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        $vendorAccount = $user->vendorAccount;

        return $user->hasRole('vendor')
            && $vendorAccount !== null
            && $product->vendor_account_id === $vendorAccount->id;
    }
}
