<?php

namespace App\Support\Vendor;

use App\Models\User;
use App\Models\VendorAccount;
use App\Services\Vendor\VendorAccessService;

final class VendorAccessResolver
{
    public static function vendorAccount(User $user): ?VendorAccount
    {
        return app(VendorAccessService::class)->resolveVendorAccount($user);
    }
}
