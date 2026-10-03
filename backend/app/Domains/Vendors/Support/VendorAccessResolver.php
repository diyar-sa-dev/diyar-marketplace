<?php

namespace App\Domains\Vendors\Support;

use App\Models\User;
use App\Models\VendorAccount;
use App\Domains\Vendors\Services\VendorAccessService;

final class VendorAccessResolver
{
    public static function vendorAccount(User $user): ?VendorAccount
    {
        return app(VendorAccessService::class)->resolveVendorAccount($user);
    }
}
