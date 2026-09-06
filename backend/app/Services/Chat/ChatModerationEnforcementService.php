<?php

namespace App\Services\Chat;

use App\Enums\ProductStatus;
use App\Models\AffiliateProfile;
use App\Models\B2bCompany;
use App\Models\Product;
use App\Models\User;
use App\Services\Admin\AdminAffiliateProfileService;
use App\Services\Admin\AdminProductService;
use App\Services\Admin\AdminProviderAccountService;
use App\Services\Admin\AdminUserService;
use App\Services\Admin\AdminVendorAccountService;
use App\Services\B2b\AdminB2bService;

final class ChatModerationEnforcementService
{
    public function __construct(
        private readonly AdminUserService $users,
        private readonly AdminVendorAccountService $vendors,
        private readonly AdminProviderAccountService $providers,
        private readonly AdminAffiliateProfileService $affiliates,
        private readonly AdminProductService $products,
        private readonly AdminB2bService $b2b,
    ) {}

    public function suspendReportedUser(User $target, User $admin, ?string $reason): void
    {
        $target->loadMissing(['vendorAccount', 'providerAccount']);

        $this->users->suspend($target, $admin, $reason);

        if ($target->vendorAccount !== null) {
            $this->vendors->suspend($target->vendorAccount, $admin, $reason);

            Product::query()
                ->where('vendor_account_id', $target->vendorAccount->id)
                ->where('status', ProductStatus::Active)
                ->orderBy('id')
                ->each(fn (Product $product) => $this->products->deactivate($product, $admin, $reason));
        }

        if ($target->providerAccount !== null) {
            $this->providers->suspend($target->providerAccount, $admin, $reason);
        }

        $affiliateProfile = AffiliateProfile::query()->where('user_id', $target->id)->first();
        if ($affiliateProfile !== null) {
            $this->affiliates->suspend($affiliateProfile, $admin, $reason);
        }

        B2bCompany::query()
            ->where(function ($query) use ($target): void {
                $query->where('owner_user_id', $target->id);

                if ($target->vendorAccount !== null) {
                    $query->orWhere('vendor_account_id', $target->vendorAccount->id);
                }

                if ($target->providerAccount !== null) {
                    $query->orWhere('provider_account_id', $target->providerAccount->id);
                }
            })
            ->orderBy('id')
            ->each(fn (B2bCompany $company) => $this->b2b->unpublishCompany($company, $admin));
    }
}
