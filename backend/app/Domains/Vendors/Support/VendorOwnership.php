<?php

namespace App\Domains\Vendors\Support;

use App\Domains\Vendors\Services\VendorAccessService;
use App\Models\Product;
use App\Models\User;
use App\Models\VendorAccount;

final class VendorOwnership
{
    public function userVendorAccountId(User $user): ?string
    {
        return app(VendorAccessService::class)->resolveVendorAccount($user)?->id;
    }

    public function userOwnsVendorAccount(User $user, string $vendorAccountId): bool
    {
        $ownedId = $this->userVendorAccountId($user);

        return $ownedId !== null && $ownedId === $vendorAccountId;
    }

    public function userOwnsProduct(User $user, Product $product): bool
    {
        return $this->userOwnsVendorAccount($user, $product->vendor_account_id);
    }

    public function userOwnsVendor(User $user, VendorAccount $vendor): bool
    {
        return $this->userOwnsVendorAccount($user, $vendor->id);
    }
}
