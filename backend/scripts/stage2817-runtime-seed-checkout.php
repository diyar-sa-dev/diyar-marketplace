<?php

declare(strict_types=1);

/**
 * Prepare checkout concurrency fixture (stock=1) inside running stack.
 *
 * Usage: php scripts/stage2817-runtime-seed-checkout.php
 * Outputs JSON to stdout.
 */

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Enums\AddressType;
use App\Enums\AvailabilityMode;
use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Enums\UserStatus;
use App\Models\Address;
use App\Models\Product;
use App\Models\ProductInventory;
use App\Models\Role;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorShippingSettings;
use Illuminate\Support\Str;

$password = (string) config('diyar.demo.password', 'Password123!');

$vendorUser = User::query()->where('phone', '966500000002')->first();
if (! $vendorUser?->vendorAccount) {
    fwrite(STDERR, "Demo vendor missing — run DatabaseSeeder first.\n");
    exit(1);
}

$vendorAccount = $vendorUser->vendorAccount;

VendorShippingSettings::query()->firstOrCreate(
    ['vendor_account_id' => $vendorAccount->id],
    [
        'carrier_enabled' => true,
        'carrier_flat_rate' => '28.00',
        'carrier_free_shipping_enabled' => false,
        'pickup_enabled' => true,
        'pickup_location_label' => 'Runtime Gate Branch',
    ],
);

$product = Product::factory()->create([
    'vendor_account_id' => $vendorAccount->id,
    'sale_price' => '150.00',
    'availability_mode' => AvailabilityMode::InStock,
]);

$inventory = ProductInventory::query()->where('product_id', $product->id)->firstOrFail();
$inventory->forceFill([
    'stock_quantity' => 1,
    'reserved_quantity' => 0,
]);
$inventory->syncAvailableQuantity();
$inventory->save();

$customerRole = Role::query()->where('name', RoleName::Customer->value)->firstOrFail();
$customers = [];

for ($i = 1; $i <= 4; $i++) {
    $phone = '9665090200'.str_pad((string) $i, 2, '0', STR_PAD_LEFT);
    $user = User::query()->updateOrCreate(
        ['phone' => $phone],
        [
            'name' => "Runtime Customer {$i}",
            'email' => "runtime-customer-{$i}-".Str::lower(Str::random(6)).'@diyar.local',
            'email_verified_at' => now(),
            'password' => $password,
            'status' => UserStatus::Active,
            'phone_verified_at' => now(),
        ],
    );

    if (! $user->roles()->where('roles.id', $customerRole->id)->exists()) {
        $user->roles()->attach($customerRole->id, ['status' => RoleStatus::Active->value]);
    }

    $address = Address::query()->firstOrCreate(
        ['user_id' => $user->id, 'is_default' => true],
        [
            'label' => 'Home',
            'type' => AddressType::Home->value,
            'recipient_name' => $user->name,
            'phone' => '050901'.str_pad((string) $i, 3, '0', STR_PAD_LEFT),
            'city' => 'Riyadh',
            'district' => 'Al Olaya',
            'street' => 'Gate Street',
            'building' => (string) $i,
        ],
    );

    $customers[] = [
        'identifier' => substr($phone, 3),
        'password' => $password,
        'user_id' => $user->id,
        'address_id' => $address->id,
    ];
}

echo json_encode([
    'product_id' => $product->id,
    'vendor_account_id' => $vendorAccount->id,
    'available_quantity' => $inventory->fresh()->available_quantity,
    'customers' => $customers,
], JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT)."\n";
