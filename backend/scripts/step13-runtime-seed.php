<?php

declare(strict_types=1);

/**
 * Step 13 — Local VPS Simulation Runtime Seed
 * Seeds canonical testing users (Customer A, Customer B, Vendor, Provider, Affiliate, Admin)
 * and representative product / category / inventory fixtures for runtime validation.
 */

use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use App\Enums\AddressType;
use App\Enums\AvailabilityMode;
use App\Enums\ProductStatus;
use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Enums\UserStatus;
use App\Enums\VendorAccountStatus;
use App\Models\Address;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductInventory;
use App\Models\Role;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorShippingSettings;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

echo "=== Seeding Step 13 Runtime Validation Fixtures ===\n";

$password = Hash::make('Password123!');

// Helper to attach role
$attachRole = function (User $user, RoleName $roleName): void {
    $role = Role::query()->where('name', $roleName->value)->firstOrFail();
    if (! $user->roles()->where('roles.id', $role->id)->exists()) {
        $user->roles()->attach($role->id, [
            'id' => (string) Str::uuid(),
            'status' => RoleStatus::Active->value,
            'assigned_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
};

// 1. Admin
$admin = User::query()->firstOrCreate(
    ['email' => 'admin@diyar.local'],
    [
        'phone' => '966500000001',
        'name' => 'DIYAR Admin',
        'email_verified_at' => now(),
        'password' => $password,
        'status' => UserStatus::Active,
        'phone_verified_at' => now(),
    ]
);
$attachRole($admin, RoleName::Admin);
echo "[OK] Admin user seeded (admin@diyar.local)\n";

// 2. Vendor
$vendorUser = User::query()->firstOrCreate(
    ['email' => 'vendor@diyar.local'],
    [
        'phone' => '966500000002',
        'name' => 'DIYAR Demo Vendor',
        'email_verified_at' => now(),
        'password' => $password,
        'status' => UserStatus::Active,
        'phone_verified_at' => now(),
    ]
);
$attachRole($vendorUser, RoleName::Vendor);

$vendorAccount = VendorAccount::query()->firstOrCreate(
    ['user_id' => $vendorUser->id],
    [
        'business_name' => 'متجر ديار للأثاث الفاخر',
        'slug' => 'diyar-luxury-furniture',
        'status' => VendorAccountStatus::Active,
        'commission_rate' => '10.00',
        'approved_at' => now(),
    ]
);

VendorShippingSettings::query()->firstOrCreate(
    ['vendor_account_id' => $vendorAccount->id],
    [
        'carrier_enabled' => true,
        'carrier_flat_rate' => '25.00',
        'carrier_free_shipping_enabled' => false,
        'pickup_enabled' => true,
        'pickup_location_label' => 'الفرع الرئيسي - الرياض',
    ]
);
echo "[OK] Vendor user & store seeded (vendor@diyar.local)\n";

// 3. Customer A
$customerA = User::query()->firstOrCreate(
    ['email' => 'customer-a@diyar.local'],
    [
        'phone' => '966500000011',
        'name' => 'Customer Alpha',
        'email_verified_at' => now(),
        'password' => $password,
        'status' => UserStatus::Active,
        'phone_verified_at' => now(),
    ]
);
$attachRole($customerA, RoleName::Customer);

Address::query()->firstOrCreate(
    ['user_id' => $customerA->id, 'type' => AddressType::Home],
    [
        'label' => 'منزل الرياض',
        'recipient_name' => 'Customer Alpha',
        'phone' => '966500000011',
        'city' => 'الرياض',
        'district' => 'الياسمين',
        'street' => 'طريق الملك فهد',
        'country_code' => 'SA',
        'postal_code' => '12345',
        'is_default' => true,
    ]
);
echo "[OK] Customer A seeded (customer-a@diyar.local)\n";

// 4. Customer B
$customerB = User::query()->firstOrCreate(
    ['email' => 'customer-b@diyar.local'],
    [
        'phone' => '966500000012',
        'name' => 'Customer Beta',
        'email_verified_at' => now(),
        'password' => $password,
        'status' => UserStatus::Active,
        'phone_verified_at' => now(),
    ]
);
$attachRole($customerB, RoleName::Customer);
echo "[OK] Customer B seeded (customer-b@diyar.local)\n";

// 5. Category & Representative Product
$category = Category::query()->first();
if (! $category) {
    $category = Category::query()->create([
        'name' => 'غرف المعيشة',
        'name_en' => 'Living Rooms',
        'slug' => 'living-rooms',
        'is_active' => true,
    ]);
}

$product = Product::query()->firstOrCreate(
    ['slug' => 'sim-luxury-sofa'],
    [
        'vendor_account_id' => $vendorAccount->id,
        'category_id' => $category->id,
        'name' => 'كنبة مريحة فاخرة ثلاثية',
        'name_en' => 'Luxury 3-Seater Comfort Sofa',
        'description' => 'كنبة فاخرة مصممة من أجود أنواع الأقمشة والخشب الزان.',
        'description_en' => 'Luxury comfort sofa made from beech wood and high quality fabrics.',
        'price' => '1000.00',
        'sale_price' => '850.00',
        'sku' => 'SOFA-SIM-001',
        'status' => ProductStatus::Active,
        'availability_mode' => AvailabilityMode::InStock,
        'is_featured' => true,
    ]
);

$inventory = ProductInventory::query()->firstOrCreate(
    ['product_id' => $product->id],
    [
        'stock_quantity' => 10,
        'reserved_quantity' => 0,
        'available_quantity' => 10,
        'safety_stock' => 0,
        'low_stock_threshold' => 2,
    ]
);
$inventory->available_quantity = 10;
$inventory->save();
echo "[OK] Product & Inventory seeded (slug: {$product->slug}, stock: {$inventory->stock_quantity}, available: {$inventory->available_quantity})\n";

echo "=== Seed Complete ===\n";
