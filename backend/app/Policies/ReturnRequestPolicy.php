<?php

namespace App\Policies;

use App\Models\ReturnRequest;
use App\Models\User;
use App\Models\VendorOrder;

class ReturnRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, ReturnRequest $returnRequest): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($returnRequest->user_id === $user->id) {
            return true;
        }

        $vendorAccount = $user->vendorAccount;

        return $vendorAccount !== null
            && VendorOrder::query()
                ->where('id', $returnRequest->vendor_order_id)
                ->where('vendor_account_id', $vendorAccount->id)
                ->exists();
    }

    public function create(User $user): bool
    {
        return $user->hasRole('customer') || $user->hasRole('admin');
    }

    public function manage(User $user, ReturnRequest $returnRequest): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        $vendorAccount = $user->vendorAccount;

        return $vendorAccount !== null
            && VendorOrder::query()
                ->where('id', $returnRequest->vendor_order_id)
                ->where('vendor_account_id', $vendorAccount->id)
                ->exists();
    }
}
