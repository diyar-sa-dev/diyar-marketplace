<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;
use App\Services\Vendor\VendorAccessService;
use App\Support\Vendor\VendorAccessResolver;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin')
            || ($user->hasRole('vendor') && VendorAccessResolver::vendorAccount($user) !== null);
    }

    public function view(User $user, Product $product): bool
    {
        return $this->belongsToVendorTeam($user, $product);
    }

    public function create(User $user): bool
    {
        return app(VendorAccessService::class)->canWrite($user, 'products');
    }

    public function update(User $user, Product $product): bool
    {
        return $this->ownsOrAdmin($user, $product, write: true);
    }

    public function delete(User $user, Product $product): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        $vendorAccount = VendorAccessResolver::vendorAccount($user);

        if ($vendorAccount === null || $product->vendor_account_id !== $vendorAccount->id) {
            return false;
        }

        $access = app(VendorAccessService::class);

        return $access->allows($user, 'products_delete');
    }

    private function belongsToVendorTeam(User $user, Product $product): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        $vendorAccount = VendorAccessResolver::vendorAccount($user);

        if ($vendorAccount === null || $product->vendor_account_id !== $vendorAccount->id) {
            return false;
        }

        return app(VendorAccessService::class)->allows($user, 'dashboard');
    }

    private function ownsOrAdmin(User $user, Product $product, bool $write): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        $vendorAccount = VendorAccessResolver::vendorAccount($user);

        if ($vendorAccount === null || $product->vendor_account_id !== $vendorAccount->id) {
            return false;
        }

        if (! $write) {
            return app(VendorAccessService::class)->allows($user, 'products');
        }

        return app(VendorAccessService::class)->canWrite($user, 'products');
    }
}
