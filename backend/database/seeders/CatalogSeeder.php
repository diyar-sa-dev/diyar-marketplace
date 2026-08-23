<?php

namespace Database\Seeders;

use App\Enums\AvailabilityMode;
use App\Enums\ProductStatus;
use App\Enums\ProductType;
use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Enums\UserStatus;
use App\Enums\VendorAccountStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductColor;
use App\Models\ProductInventory;
use App\Models\Role;
use App\Models\User;
use App\Models\VendorAccount;
use Database\Seeders\Concerns\UsesDemoPassword;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    use UsesDemoPassword;

    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $vendorRole = Role::query()->where('name', RoleName::Vendor->value)->firstOrFail();

        $primaryVendor = VendorAccount::query()->where('slug', 'diyar-furniture')->first();
        if ($primaryVendor === null) {
            $vendorUser = User::query()->where('email', 'vendor@diyar.local')->firstOrFail();
            $primaryVendor = VendorAccount::query()->updateOrCreate(
                ['user_id' => $vendorUser->id],
                [
                    'business_name' => 'متجر ديار للأثاث',
                    'slug' => 'diyar-furniture',
                    'description' => 'أثاث منزلي عالي الجودة من ديار',
                    'location' => 'الرياض',
                    'status' => VendorAccountStatus::Active,
                ],
            );
        }

        $emptyVendorUser = User::query()->firstOrCreate(
            ['phone' => '966500000007'],
            [
                'name' => 'Empty Showcase Vendor',
                'email' => 'empty-vendor@diyar.local',
                'email_verified_at' => now(),
                'password' => $this->demoPassword(),
                'status' => UserStatus::Active,
                'phone_verified_at' => now(),
            ],
        );

        if (! $emptyVendorUser->roles()->where('roles.id', $vendorRole->id)->exists()) {
            $emptyVendorUser->roles()->attach($vendorRole->id, [
                'id' => (string) str()->uuid(),
                'status' => RoleStatus::Active->value,
            ]);
        }

        $emptyVendor = VendorAccount::query()->updateOrCreate(
            ['user_id' => $emptyVendorUser->id],
            [
                'business_name' => 'بيت التصميم',
                'slug' => 'bayt-al-tasmim',
                'description' => 'متجر جديد — قيد التجهيز',
                'location' => 'الرياض',
                'status' => VendorAccountStatus::Active,
            ],
        );

        $vendorAccounts = [
            'diyar-furniture' => $primaryVendor,
            'bayt-al-tasmim' => $emptyVendor,
        ];

        $products = [
            ['vendor' => 'diyar-furniture', 'name' => 'سرير خشبي مزدوج', 'category' => 'bedroom', 'sale' => 2499, 'compare' => 2799, 'stock' => 20, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'خشبي', 'hex' => '#8B7355']]],
            ['vendor' => 'diyar-furniture', 'name' => 'كنبة ثلاثية', 'category' => 'living-room', 'sale' => 1899, 'compare' => 2199, 'stock' => 12, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'رمادي', 'hex' => '#9CA3AF']]],
            ['vendor' => 'diyar-furniture', 'name' => 'طاولة طعام', 'category' => 'dining', 'sale' => 1299, 'compare' => 1499, 'stock' => 8, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'بني', 'hex' => '#8B4513']]],
            ['vendor' => 'diyar-furniture', 'name' => 'مكتب عمل', 'category' => 'office', 'sale' => 899, 'compare' => null, 'stock' => 15, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'أسود', 'hex' => '#111827']]],
            ['vendor' => 'diyar-furniture', 'name' => 'مصباح أرضي', 'category' => 'lighting', 'sale' => 349, 'compare' => 449, 'stock' => 0, 'mode' => AvailabilityMode::OutOfStock, 'colors' => [['name' => 'ذهبي', 'hex' => '#D4AF37']]],
            ['vendor' => 'diyar-furniture', 'name' => 'خزانة ملابس مودرن', 'category' => 'bedroom', 'sale' => 3200, 'compare' => 3600, 'stock' => 5, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'كريمي', 'hex' => '#F5F5DC']]],
            ['vendor' => 'diyar-furniture', 'name' => 'طاولة قهوة', 'category' => 'living-room', 'sale' => 450, 'compare' => null, 'stock' => 18, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'زجاج', 'hex' => '#E5E7EB']]],
            ['vendor' => 'diyar-furniture', 'name' => 'كرسي استرخاء', 'category' => 'living-room', 'sale' => 1750, 'compare' => 1999, 'stock' => 0, 'mode' => AvailabilityMode::Preorder, 'expected' => now()->addWeeks(3)->toDateString(), 'colors' => [['name' => 'بيج', 'hex' => '#F5F5DC']]],
            ['vendor' => 'diyar-furniture', 'name' => 'مرتبة طبية', 'category' => 'bedroom', 'sale' => 1100, 'compare' => 1300, 'stock' => 25, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'أبيض', 'hex' => '#FFFFFF']]],
            ['vendor' => 'diyar-furniture', 'name' => 'رف كتب', 'category' => 'office', 'sale' => 650, 'compare' => null, 'stock' => 10, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'خشبي', 'hex' => '#8B7355']]],
            ['vendor' => 'diyar-furniture', 'name' => 'سجادة صالة', 'category' => 'decor', 'sale' => 799, 'compare' => 999, 'stock' => 6, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'بيج', 'hex' => '#F5F5DC']]],
            ['vendor' => 'diyar-furniture', 'name' => 'طقم ستائر', 'category' => 'curtains', 'sale' => 550, 'compare' => 650, 'stock' => 14, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'رمادي', 'hex' => '#9CA3AF']]],
        ];

        foreach ($products as $sample) {
            $vendor = $vendorAccounts[$sample['vendor']] ?? null;
            $category = Category::query()->where('slug', $sample['category'])->first();

            if ($vendor === null || $category === null) {
                continue;
            }

            $product = Product::query()->updateOrCreate(
                [
                    'vendor_account_id' => $vendor->id,
                    'slug' => str()->slug($sample['name']),
                ],
                [
                    'category_id' => $category->id,
                    'name' => $sample['name'],
                    'description' => 'منتج تجريبي من '.$vendor->business_name.'.',
                    'sale_price' => $sample['sale'],
                    'compare_price' => $sample['compare'],
                    'product_type' => ProductType::Single,
                    'availability_mode' => $sample['mode'],
                    'expected_available_at' => $sample['expected'] ?? null,
                    'status' => ProductStatus::Active,
                    'warranty' => 'سنة واحدة',
                    'materials' => ['main' => 'خشب', 'fabric' => 'قماش'],
                ],
            );

            $product->colors()->delete();
            foreach ($sample['colors'] as $color) {
                ProductColor::query()->create([
                    'product_id' => $product->id,
                    'name' => $color['name'],
                    'hex_code' => $color['hex'],
                ]);
            }

            ProductInventory::query()->updateOrCreate(
                ['product_id' => $product->id],
                [
                    'stock_quantity' => $sample['stock'],
                    'reserved_quantity' => 0,
                    'available_quantity' => max(0, $sample['stock']),
                ],
            );
        }
    }
}
