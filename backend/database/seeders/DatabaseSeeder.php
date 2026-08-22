<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            AdminSeeder::class,
            AdminPermissionSeeder::class,
            CategorySeeder::class,
            CatalogSeeder::class,
            ServiceMarketplaceSeeder::class,
            VendorShippingSettingsSeeder::class,
            CommissionRuleSeeder::class,
            SystemSettingSeeder::class,
            HomeEngagementSeeder::class,
        ]);
    }
}
