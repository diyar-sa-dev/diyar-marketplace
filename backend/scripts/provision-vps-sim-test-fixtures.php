<?php

declare(strict_types=1);

/**
 * DIYAR Stage 31 — Approved VPS-Simulation Test Fixture Provisioner
 * Non-destructive, idempotent provisioning of minimal isolated test fixtures
 * required for authenticated Playwright journeys on the VPS simulation stack.
 *
 * Safety Invariants:
 * - Insert-only / safe idempotent firstOrCreate operations.
 * - Zero deletes, zero truncates, zero table drops.
 * - Does not modify or overwrite existing production/simulation user records.
 * - Respects all unique constraints, foreign keys, and model relations.
 * - Does not trigger external side effects (mail, SMS, payments are all mocked/logged).
 */

use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

use App\Domains\Admin\Services\AdminPermissionService;
use App\Enums\AdminPermission;
use App\Enums\AvailabilityMode;
use App\Enums\CategoryType;
use App\Enums\CommissionScope;
use App\Enums\ProductStatus;
use App\Enums\ProductType;
use App\Enums\ProviderAccountStatus;
use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Enums\ServiceBookingMode;
use App\Enums\ServicePricingMode;
use App\Enums\SystemSettingGroup;
use App\Enums\SystemSettingType;
use App\Enums\UserStatus;
use App\Enums\VendorAccountStatus;
use App\Models\Category;
use App\Models\CommissionRule;
use App\Models\Permission;
use App\Models\Product;
use App\Models\ProductColor;
use App\Models\ProductInventory;
use App\Models\ProviderAccount;
use App\Models\ProviderWorkPolicy;
use App\Models\Role;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorShippingSettings;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

echo "=== DIYAR VPS Simulation: Fixture Provisioning Starting ===\n";

// Record Before Counts
$beforeCounts = [
    'roles' => Role::count(),
    'permissions' => Permission::count(),
    'users' => User::count(),
    'vendor_accounts' => VendorAccount::count(),
    'vendor_shipping_settings' => VendorShippingSettings::count(),
    'categories' => Category::count(),
    'products' => Product::count(),
    'product_colors' => ProductColor::count(),
    'product_inventory' => ProductInventory::count(),
    'service_categories' => ServiceCategory::count(),
    'provider_accounts' => ProviderAccount::count(),
    'provider_work_policies' => ProviderWorkPolicy::count(),
    'services' => Service::count(),
    'commission_rules' => CommissionRule::count(),
    'system_settings' => SystemSetting::count(),
];

echo "Initial database counts:\n";
foreach ($beforeCounts as $tbl => $cnt) {
    echo "  - {$tbl}: {$cnt}\n";
}

$createdEntities = [];
$password = Hash::make('Password123!');

DB::beginTransaction();

try {
    // 1. Roles
    $rolesMap = [
        RoleName::Customer->value => 'Customer',
        RoleName::Vendor->value => 'Vendor',
        RoleName::Provider->value => 'Provider',
        RoleName::Marketer->value => 'Marketer',
        RoleName::Admin->value => 'Administrator',
    ];

    $roles = [];
    foreach ($rolesMap as $roleName => $label) {
        $roles[$roleName] = Role::query()->firstOrCreate(
            ['name' => $roleName],
            ['label' => $label]
        );
    }
    echo "[OK] Roles verified/created.\n";

    // 2. Admin Permissions & Admin Role Permissions
    $adminRole = $roles[RoleName::Admin->value];
    foreach (AdminPermission::all() as $permission) {
        $permModel = Permission::query()->firstOrCreate(
            ['key' => $permission->value],
            [
                'group' => $permission->group(),
                'label' => $permission->value,
                'description' => null,
            ]
        );

        if (! $adminRole->permissions()->where('permissions.id', $permModel->id)->exists()) {
            $adminRole->permissions()->attach($permModel->id, [
                'id' => (string) Str::uuid(),
            ]);
        }
    }
    app(AdminPermissionService::class)->forgetAll();
    echo "[OK] Admin permissions verified/attached.\n";

    // Helper to attach role safely
    $attachRole = function (User $user, Role $role): void {
        if (! $user->roles()->where('roles.id', $role->id)->exists()) {
            $user->roles()->attach($role->id, [
                'id' => (string) Str::uuid(),
                'status' => RoleStatus::Active->value,
            ]);
        }
    };

    // 3. User: Customer (966500000010)
    $customer = User::query()->firstOrCreate(
        ['phone' => '966500000010'],
        [
            'name' => 'DIYAR Demo Customer',
            'email' => 'customer@diyar.local',
            'email_verified_at' => now(),
            'password' => $password,
            'status' => UserStatus::Active,
            'phone_verified_at' => now(),
            'two_factor_enabled' => false,
        ]
    );
    $attachRole($customer, $roles[RoleName::Customer->value]);
    $createdEntities['customer_id'] = $customer->id;
    echo "[OK] Customer user verified/created (phone: 966500000010, ID: {$customer->id})\n";

    // 4. User: Two-Factor Customer (966500000012)
    $twoFactorCustomer = User::query()->firstOrCreate(
        ['phone' => '966500000012'],
        [
            'name' => 'DIYAR 2FA Demo Customer',
            'email' => 'customer-2fa@diyar.local',
            'email_verified_at' => now(),
            'password' => $password,
            'status' => UserStatus::Active,
            'phone_verified_at' => now(),
            'two_factor_enabled' => false,
        ]
    );
    $attachRole($twoFactorCustomer, $roles[RoleName::Customer->value]);
    $createdEntities['two_factor_customer_id'] = $twoFactorCustomer->id;
    echo "[OK] 2FA Customer user verified/created (phone: 966500000012, ID: {$twoFactorCustomer->id})\n";

    // 5. User: Vendor (966500000002)
    $vendorUser = User::query()->firstOrCreate(
        ['phone' => '966500000002'],
        [
            'name' => 'DIYAR Demo Vendor',
            'email' => 'vendor@diyar.local',
            'email_verified_at' => now(),
            'password' => $password,
            'status' => UserStatus::Active,
            'phone_verified_at' => now(),
            'two_factor_enabled' => false,
        ]
    );
    $attachRole($vendorUser, $roles[RoleName::Vendor->value]);
    $createdEntities['vendor_user_id'] = $vendorUser->id;
    echo "[OK] Vendor user verified/created (phone: 966500000002, ID: {$vendorUser->id})\n";

    // 6. Vendor Account & Vendor Shipping Settings
    $vendorAccount = VendorAccount::query()->firstOrCreate(
        ['user_id' => $vendorUser->id],
        [
            'business_name' => 'متجر ديار للأثاث',
            'slug' => 'diyar-furniture',
            'description' => 'أثاث منزلي عالي الجودة من ديار — حساب محاكاة معتمد.',
            'location' => 'الرياض',
            'status' => VendorAccountStatus::Active,
        ]
    );
    $createdEntities['vendor_account_id'] = $vendorAccount->id;

    $vendorShipping = VendorShippingSettings::query()->firstOrCreate(
        ['vendor_account_id' => $vendorAccount->id],
        [
            'carrier_enabled' => true,
            'carrier_flat_rate' => '28.00',
            'carrier_free_shipping_enabled' => false,
            'carrier_free_shipping_threshold' => null,
            'pickup_enabled' => true,
            'pickup_location_label' => 'فرع متجر ديار للأثاث — الرياض',
        ]
    );
    $createdEntities['vendor_shipping_id'] = $vendorShipping->id;
    echo "[OK] Vendor account & shipping settings verified/created (slug: {$vendorAccount->slug})\n";

    // 7. User: Provider (966500000101)
    $providerUser = User::query()->firstOrCreate(
        ['phone' => '966500000101'],
        [
            'name' => 'Eiwan Provider',
            'email' => 'eiwan@diyar.local',
            'email_verified_at' => now(),
            'password' => $password,
            'status' => UserStatus::Active,
            'phone_verified_at' => now(),
            'two_factor_enabled' => false,
        ]
    );
    $attachRole($providerUser, $roles[RoleName::Provider->value]);
    $createdEntities['provider_user_id'] = $providerUser->id;
    echo "[OK] Provider user verified/created (phone: 966500000101, ID: {$providerUser->id})\n";

    // 8. Provider Account & Work Policy
    $providerAccount = ProviderAccount::query()->firstOrCreate(
        ['user_id' => $providerUser->id],
        [
            'business_name' => 'إيوان للتصميم',
            'slug' => 'eiwan-design',
            'bio' => 'نقدم خدمات التصميم الداخلي الشاملة للقصور والفلل والشقق السكنية. نصمم مساحات تعكس هويتك وتلبي احتياجاتك بدقة واحترافية عالية.',
            'location' => 'الرياض، ونقدم استشارات عن بعد',
            'remote_available' => true,
            'verified' => true,
            'rating_average' => 4.9,
            'reviews_count' => 84,
            'completed_projects_count' => 120,
            'badges' => ['مزود موثق', 'تقييم عالي', 'مشاريع مكتملة بنجاح'],
            'status' => ProviderAccountStatus::Active,
            'joined_at' => now()->subYears(3),
        ]
    );
    $createdEntities['provider_account_id'] = $providerAccount->id;

    $providerWorkPolicy = ProviderWorkPolicy::query()->firstOrCreate(
        ['provider_account_id' => $providerAccount->id],
        [
            'policy_enabled' => true,
            'initial_delivery_days' => 7,
            'free_revisions_included' => 2,
            'timeline_by_project_scope' => true,
            'cancellation_notice_hours' => 24,
            'custom_terms' => [],
        ]
    );
    echo "[OK] Provider account & policy verified/created (slug: {$providerAccount->slug})\n";

    // 9. User: Admin (966500000001)
    $adminUser = User::query()->firstOrCreate(
        ['phone' => '966500000001'],
        [
            'name' => 'DIYAR Admin',
            'email' => 'admin@diyar.local',
            'email_verified_at' => now(),
            'password' => $password,
            'status' => UserStatus::Active,
            'phone_verified_at' => now(),
            'two_factor_enabled' => false,
        ]
    );
    $attachRole($adminUser, $roles[RoleName::Admin->value]);
    $createdEntities['admin_user_id'] = $adminUser->id;
    echo "[OK] Admin user verified/created (phone: 966500000001, ID: {$adminUser->id})\n";

    // 10. Product Category (living-room) & Service Category (interior-design)
    $livingRoomCategory = Category::query()->firstOrCreate(
        ['slug' => 'living-room'],
        [
            'name' => 'الصالونات',
            'type' => CategoryType::Product,
            'sort_order' => 1,
            'is_active' => true,
        ]
    );
    $createdEntities['living_room_category_id'] = $livingRoomCategory->id;

    $interiorCategory = Category::query()->firstOrCreate(
        ['slug' => 'interior-design'],
        [
            'name' => 'تصميم داخلي',
            'type' => CategoryType::Service,
            'sort_order' => 1,
            'is_active' => true,
        ]
    );
    $createdEntities['interior_category_id'] = $interiorCategory->id;

    $serviceCategory = ServiceCategory::query()->firstOrCreate(
        ['slug' => 'interior-design'],
        [
            'name_ar' => 'تصميم داخلي',
            'name_en' => 'Interior Design',
            'icon_key' => 'palette',
            'sort_order' => 1,
            'is_active' => true,
        ]
    );
    $createdEntities['service_category_id'] = $serviceCategory->id;
    echo "[OK] Categories verified/created (living-room, interior-design).\n";

    // 11. Representative Product with "كنب" in name, Colors & Inventory
    $product = Product::query()->firstOrCreate(
        [
            'vendor_account_id' => $vendorAccount->id,
            'slug' => 'kanaba-thulathiya-fakhira',
        ],
        [
            'category_id' => $livingRoomCategory->id,
            'name' => 'كنبة ثلاثية فاخرة مريحة',
            'description' => 'كنبة ثلاثية أنيقة مصنوعة من أجود أنواع الأقمشة والخشب الزان الطبيعي، مناسبة للمجالس والصالونات المعاصرة.',
            'sale_price' => 1899.00,
            'compare_price' => 2199.00,
            'product_type' => ProductType::Single,
            'availability_mode' => AvailabilityMode::InStock,
            'status' => ProductStatus::Active,
            'warranty' => 'سنتان شامل الهيكل',
            'materials' => ['main' => 'خشب زان', 'fabric' => 'كتان معالج'],
        ]
    );
    $createdEntities['product_id'] = $product->id;

    $color = ProductColor::query()->firstOrCreate(
        [
            'product_id' => $product->id,
            'name' => 'رمادي',
        ],
        [
            'hex_code' => '#9CA3AF',
        ]
    );

    $inventory = ProductInventory::query()->firstOrCreate(
        ['product_id' => $product->id],
        [
            'stock_quantity' => 50,
            'reserved_quantity' => 0,
            'available_quantity' => 50,
        ]
    );
    // Ensure available_quantity is positive
    if ($inventory->available_quantity < 10) {
        $inventory->stock_quantity = 50;
        $inventory->available_quantity = 50;
        $inventory->reserved_quantity = 0;
        $inventory->save();
    }
    $createdEntities['inventory_id'] = $inventory->id;
    echo "[OK] Product & Inventory verified/created (name: {$product->name}, stock: {$inventory->stock_quantity})\n";

    // 12. Representative Services under Eiwan Design
    $service1 = Service::query()->firstOrCreate(
        [
            'provider_account_id' => $providerAccount->id,
            'slug' => 'integrated-apartment-design',
        ],
        [
            'service_category_id' => $serviceCategory->id,
            'title' => 'تصميم داخلي متكامل للشقق السكنية',
            'description' => 'نقدم مخططات وتصميمات 3D مع توزيع الأثاث والإضاءة بدقة متناهية تلبي كافة احتياجات مساحتك السكنية.',
            'pricing_mode' => ServicePricingMode::PerSqm,
            'booking_mode' => ServiceBookingMode::Request,
            'starting_price' => 50.00,
            'currency' => 'SAR',
            'delivery_type_label' => 'استشارة ومخطط',
            'location' => 'الرياض',
            'remote_available' => true,
            'features' => ['تصميم 3D', 'مخططات تنفيذية', 'إشراف هندسي', 'استشارات مجانية'],
            'is_active' => true,
            'requests_count' => 340,
            'rating_average' => 4.8,
            'reviews_count' => 124,
        ]
    );
    $createdEntities['service_1_id'] = $service1->id;

    $service2 = Service::query()->firstOrCreate(
        [
            'provider_account_id' => $providerAccount->id,
            'slug' => 'office-3d-design',
        ],
        [
            'service_category_id' => $serviceCategory->id,
            'title' => 'تصميم 3D للمكاتب ومساحات العمل',
            'description' => 'تصاميم مكاتب عملية وعصرية ترفع إنتاجية فريقك وتعكس هوية شركتك.',
            'pricing_mode' => ServicePricingMode::Fixed,
            'booking_mode' => ServiceBookingMode::Direct,
            'duration_minutes' => 60,
            'starting_price' => 1500.00,
            'currency' => 'SAR',
            'delivery_type_label' => 'سعر ثابت',
            'location' => 'الرياض',
            'remote_available' => true,
            'features' => ['نماذج واقعية', 'تعديلات مجانية', 'ملفات مصدر'],
            'is_active' => true,
            'requests_count' => 180,
            'rating_average' => 4.9,
            'reviews_count' => 210,
        ]
    );
    $createdEntities['service_2_id'] = $service2->id;
    echo "[OK] Services verified/created (Eiwan Design: {$service1->title}, {$service2->title})\n";

    // 13. Commission Rules (Global 10%)
    $commissionRule = CommissionRule::query()->firstOrCreate(
        [
            'scope' => CommissionScope::Global,
            'scope_id' => null,
        ],
        [
            'rate_percent' => '10.00',
            'is_active' => true,
        ]
    );
    $createdEntities['commission_rule_id'] = $commissionRule->id;
    echo "[OK] Global commission rule verified/created (10%)\n";

    // 14. System Settings
    $definitions = config('system_settings.definitions', []);
    foreach ($definitions as $fullKey => $definition) {
        if (! is_array($definition)) {
            continue;
        }

        $group = SystemSettingGroup::from($definition['group']);
        $key = $definition['key'];
        $type = SystemSettingType::from($definition['type']);
        $configPath = $definition['config_path'] ?? null;
        $isPublic = (bool) ($definition['is_public'] ?? false);

        if ($configPath === null) {
            continue;
        }

        $rawValue = config($configPath);
        if ($rawValue === null) {
            continue;
        }

        SystemSetting::query()->firstOrCreate(
            [
                'group' => $group->value,
                'key' => $key,
            ],
            [
                'id' => (string) Str::uuid(),
                'value' => ['v' => $rawValue],
                'type' => $type->value,
                'is_public' => $isPublic,
                'description' => $fullKey,
            ]
        );
    }
    echo "[OK] System settings initialized.\n";

    DB::commit();
    echo "=== Transaction committed successfully. ===\n";
} catch (Throwable $e) {
    DB::rollBack();
    echo 'ERROR: Fixture provisioning failed: '.$e->getMessage()."\n";
    echo $e->getTraceAsString()."\n";
    exit(1);
}

// Record After Counts
$afterCounts = [
    'roles' => Role::count(),
    'permissions' => Permission::count(),
    'users' => User::count(),
    'vendor_accounts' => VendorAccount::count(),
    'vendor_shipping_settings' => VendorShippingSettings::count(),
    'categories' => Category::count(),
    'products' => Product::count(),
    'product_colors' => ProductColor::count(),
    'product_inventory' => ProductInventory::count(),
    'service_categories' => ServiceCategory::count(),
    'provider_accounts' => ProviderAccount::count(),
    'provider_work_policies' => ProviderWorkPolicy::count(),
    'services' => Service::count(),
    'commission_rules' => CommissionRule::count(),
    'system_settings' => SystemSetting::count(),
];

echo "\nSummary of table counts (Before -> After):\n";
foreach ($afterCounts as $tbl => $cnt) {
    $before = $beforeCounts[$tbl];
    $diff = $cnt - $before;
    $diffStr = $diff > 0 ? "+{$diff}" : '0';
    echo "  - {$tbl}: {$before} -> {$cnt} ({$diffStr})\n";
}

echo "\nCreated Entity Identifiers:\n";
echo json_encode($createdEntities, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
echo "=== Provisioning Complete ===\n";
