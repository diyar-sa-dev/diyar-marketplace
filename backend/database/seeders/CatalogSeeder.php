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
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $vendorRole = Role::query()->where('name', RoleName::Vendor->value)->firstOrFail();

        $vendors = [
            ['phone' => '966500000002', 'name' => 'DIYAR Sample Vendor', 'email' => 'vendor@diyar.local', 'business' => 'متجر ديار للأثاث', 'slug' => 'diyar-furniture', 'location' => 'الرياض', 'description' => 'أثاث منزلي عالي الجودة من ديار'],
            ['phone' => '966500000003', 'name' => 'Rawae Vendor', 'email' => 'rawae@diyar.local', 'business' => 'روائع الخشب', 'slug' => 'rawae-al-khashab', 'location' => 'جدة', 'description' => 'خشب طبيعي ونجارة مخصصة'],
            ['phone' => '966500000004', 'name' => 'Zawiya Vendor', 'email' => 'zawiya@diyar.local', 'business' => 'الزاوية الحديثة', 'slug' => 'al-zawiya', 'location' => 'الدمام', 'description' => 'تصاميم عصرية للمنزل'],
            ['phone' => '966500000005', 'name' => 'Anaqa Vendor', 'email' => 'anaqa@diyar.local', 'business' => 'أناقة المنزل', 'slug' => 'anaqat-al-manzer', 'location' => 'الرياض', 'description' => 'لمسات أنيقة للمساحات السكنية'],
            ['phone' => '966500000006', 'name' => 'Lamsat Vendor', 'email' => 'lamsat@diyar.local', 'business' => 'لمسات فنية', 'slug' => 'lamsat-faniya', 'location' => 'مكة', 'description' => 'ديكورات وإكسسوارات فنية'],
            ['phone' => '966500000007', 'name' => 'Bayt Vendor', 'email' => 'bayt@diyar.local', 'business' => 'بيت التصميم', 'slug' => 'bayt-al-tasmim', 'location' => 'الرياض', 'description' => 'متجر جديد — قيد التجهيز'],
        ];

        $vendorAccounts = [];

        foreach ($vendors as $index => $vendorData) {
            $user = User::query()->firstOrCreate(
                ['phone' => $vendorData['phone']],
                [
                    'name' => $vendorData['name'],
                    'email' => $vendorData['email'],
                    'email_verified_at' => now(),
                    'password' => 'Password123!',
                    'status' => UserStatus::Active,
                    'phone_verified_at' => now(),
                ],
            );

            if (! $user->roles()->where('roles.id', $vendorRole->id)->exists()) {
                $user->roles()->attach($vendorRole->id, [
                    'id' => (string) str()->uuid(),
                    'status' => RoleStatus::Active->value,
                ]);
            }

            $vendorAccounts[$vendorData['slug']] = VendorAccount::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'business_name' => $vendorData['business'],
                    'slug' => $vendorData['slug'],
                    'description' => $vendorData['description'],
                    'location' => $vendorData['location'],
                    'status' => VendorAccountStatus::Active,
                ],
            );
        }

        $products = [
            // diyar-furniture — core demo products + pagination volume
            ['vendor' => 'diyar-furniture', 'name' => 'سرير خشبي مزدوج', 'category' => 'bedroom', 'sale' => 2499, 'compare' => 2799, 'stock' => 20, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'خشبي', 'hex' => '#8B7355'], ['name' => 'أبيض', 'hex' => '#FFFFFF']]],
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

            // rawae-al-khashab
            ['vendor' => 'rawae-al-khashab', 'name' => 'طاولة خشب زان', 'category' => 'dining', 'sale' => 2100, 'compare' => 2400, 'stock' => 4, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'زان', 'hex' => '#C4A484']]],
            ['vendor' => 'rawae-al-khashab', 'name' => 'خزانة أحذية', 'category' => 'decor', 'sale' => 780, 'compare' => null, 'stock' => 7, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'بني', 'hex' => '#8B4513']]],
            ['vendor' => 'rawae-al-khashab', 'name' => 'سرير أطفال', 'category' => 'bedroom', 'sale' => 1400, 'compare' => 1600, 'stock' => 3, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'أبيض', 'hex' => '#FFFFFF']]],

            // al-zawiya
            ['vendor' => 'al-zawiya', 'name' => 'كنبة زاوية', 'category' => 'living-room', 'sale' => 3400, 'compare' => 3800, 'stock' => 2, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'رمادي', 'hex' => '#9CA3AF'], ['name' => 'أزرق', 'hex' => '#1E3A8A']]],
            ['vendor' => 'al-zawiya', 'name' => 'مكتب زجاجي', 'category' => 'office', 'sale' => 1200, 'compare' => null, 'stock' => 5, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'شفاف', 'hex' => '#E5E7EB']]],

            // anaqat-al-manzer
            ['vendor' => 'anaqat-al-manzer', 'name' => 'مصباح سقف', 'category' => 'lighting', 'sale' => 420, 'compare' => 520, 'stock' => 9, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'أسود', 'hex' => '#111827']]],
            ['vendor' => 'anaqat-al-manzer', 'name' => 'مرآة ديكور', 'category' => 'decor', 'sale' => 290, 'compare' => null, 'stock' => 11, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'ذهبي', 'hex' => '#D4AF37']]],

            // lamsat-faniya
            ['vendor' => 'lamsat-faniya', 'name' => 'لوحة جدارية', 'category' => 'decor', 'sale' => 180, 'compare' => 220, 'stock' => 20, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'متعدد', 'hex' => '#6366F1']]],
            ['vendor' => 'lamsat-faniya', 'name' => 'مزهرية سيرamic', 'category' => 'decor', 'sale' => 95, 'compare' => null, 'stock' => 30, 'mode' => AvailabilityMode::InStock, 'colors' => [['name' => 'أبيض', 'hex' => '#FFFFFF']]],

            // bayt-al-tasmim — intentionally empty (empty vendor scenario)
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
