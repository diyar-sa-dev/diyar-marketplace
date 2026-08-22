<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VendorOrder;
use App\Services\Vendor\VendorAccessService;
use App\Support\Vendor\VendorAccessResolver;

class VendorOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('vendor') && VendorAccessResolver::vendorAccount($user) !== null;
    }

    public function view(User $user, VendorOrder $vendorOrder): bool
    {
        $vendorAccount = VendorAccessResolver::vendorAccount($user);

        return $vendorAccount !== null
            && $vendorOrder->vendor_account_id === $vendorAccount->id;
    }

    public function accept(User $user, VendorOrder $vendorOrder): bool
    {
        return $this->canManage($user, $vendorOrder);
    }

    public function process(User $user, VendorOrder $vendorOrder): bool
    {
        return $this->canManage($user, $vendorOrder);
    }

    public function ship(User $user, VendorOrder $vendorOrder): bool
    {
        return $this->canManage($user, $vendorOrder);
    }

    public function deliver(User $user, VendorOrder $vendorOrder): bool
    {
        return $this->canManage($user, $vendorOrder);
    }

    public function cancel(User $user, VendorOrder $vendorOrder): bool
    {
        return $this->canManage($user, $vendorOrder);
    }

    public function create(User $user): bool
    {
        return app(VendorAccessService::class)->canWrite($user, 'orders');
    }

    private function canManage(User $user, VendorOrder $vendorOrder): bool
    {
        return $this->view($user, $vendorOrder)
            && app(VendorAccessService::class)->canWrite($user, 'orders');
    }
}
