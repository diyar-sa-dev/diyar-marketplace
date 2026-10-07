<?php

namespace App\Domains\Vendors\Support;

use App\Domains\Vendors\Services\VendorAccessService;
use App\Models\User;
use App\Models\VendorAccount;

final class VendorAccessResolver
{
    public static function vendorAccount(User $user): ?VendorAccount
    {
        return app(VendorAccessService::class)->resolveVendorAccount($user);
    }
}
