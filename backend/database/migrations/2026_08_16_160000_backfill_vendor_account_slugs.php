<?php

use App\Models\VendorAccount;
use App\Support\SlugGenerator;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        VendorAccount::query()
            ->where(function ($query) {
                $query->whereNull('slug')->orWhere('slug', '');
            })
            ->each(function (VendorAccount $account) {
                if ($account->business_name === null || $account->business_name === '') {
                    return;
                }

                $account->slug = SlugGenerator::unique($account->business_name, new VendorAccount);
                $account->saveQuietly();
            });
    }

    public function down(): void
    {
        // Slugs are required for storefront routing; no rollback.
    }
};
