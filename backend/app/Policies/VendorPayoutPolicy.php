<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VendorPayout;
use App\Services\Vendor\VendorAccessService;
use App\Support\Vendor\VendorAccessResolver;
use Illuminate\Support\Facades\Auth;

class VendorPayoutPolicy
{
    public function viewAny(User $user): bool
    {
        if ($this->isAdminOpsContext($user)) {
            return $user->hasRole('admin');
        }

        return app(VendorAccessService::class)->allows($user, 'finance');
    }

    public function view(User $user, VendorPayout $payout): bool
    {
        if ($this->isAdminOpsContext($user)) {
            return $user->hasRole('admin');
        }

        $vendorAccount = VendorAccessResolver::vendorAccount($user);

        return $vendorAccount !== null && $payout->vendor_account_id === $vendorAccount->id;
    }

    public function create(User $user): bool
    {
        return app(VendorAccessService::class)->allows($user, 'finance_withdraw');
    }

    public function cancel(User $user, VendorPayout $payout): bool
    {
        return $this->create($user) && $this->view($user, $payout);
    }

    public function approve(User $user): bool
    {
        return $this->isAdminOpsContext($user) && $user->hasRole('admin');
    }

    public function reject(User $user): bool
    {
        return $this->isAdminOpsContext($user) && $user->hasRole('admin');
    }

    public function markPaid(User $user): bool
    {
        return $this->isAdminOpsContext($user) && $user->hasRole('admin');
    }

    private function isAdminOpsContext(User $user): bool
    {
        return Auth::guard('admin')->check()
            && (string) Auth::guard('admin')->id() === (string) $user->getAuthIdentifier();
    }
}
