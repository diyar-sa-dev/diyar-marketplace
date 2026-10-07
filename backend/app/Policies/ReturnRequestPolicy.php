<?php

namespace App\Policies;

use App\Domains\Identity\Support\MarketplaceAccess;
use App\Domains\Vendors\Services\VendorAccessService;
use App\Domains\Vendors\Support\VendorAccessResolver;
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
        if ($returnRequest->user_id === $user->id) {
            return true;
        }

        return $this->belongsToVendor($user, $returnRequest);
    }

    public function create(User $user): bool
    {
        return MarketplaceAccess::canAccessMarketplace($user);
    }

    public function manage(User $user, ReturnRequest $returnRequest): bool
    {
        return $this->belongsToVendor($user, $returnRequest)
            && app(VendorAccessService::class)->canWrite($user, 'returns');
    }

    private function belongsToVendor(User $user, ReturnRequest $returnRequest): bool
    {
        $vendorAccount = VendorAccessResolver::vendorAccount($user);

        return $vendorAccount !== null
            && VendorOrder::query()
                ->where('id', $returnRequest->vendor_order_id)
                ->where('vendor_account_id', $vendorAccount->id)
                ->exists();
    }
}
