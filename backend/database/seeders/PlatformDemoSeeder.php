<?php

namespace Database\Seeders;

use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Enums\UserStatus;
use App\Enums\VendorAccountStatus;
use App\Models\Role;
use App\Models\User;
use App\Models\VendorAccount;
use App\Support\SlugGenerator;
use Database\Seeders\Concerns\UsesDemoPassword;
use Illuminate\Database\Seeder;

/**
 * Minimal marketplace demo identities (local/staging only).
 *
 * Admin is seeded separately via AdminSeeder.
 * Provider demo user is created in ServiceMarketplaceSeeder (eiwan@diyar.local).
 */
class PlatformDemoSeeder extends Seeder
{
    use UsesDemoPassword;

    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $password = $this->demoPassword();

        $this->seedCustomer($password);
        $this->seedVendor($password);
        $this->seedMarketer($password);
    }

    private function seedCustomer(string $password): void
    {
        $role = Role::query()->where('name', RoleName::Customer->value)->firstOrFail();

        $user = User::query()->firstOrCreate(
            ['phone' => '966500000010'],
            [
                'name' => 'DIYAR Demo Customer',
                'email' => 'customer@diyar.local',
                'email_verified_at' => now(),
                'password' => $password,
                'status' => UserStatus::Active,
                'phone_verified_at' => now(),
            ],
        );

        $this->attachRole($user, $role);
    }

    private function seedVendor(string $password): void
    {
        $role = Role::query()->where('name', RoleName::Vendor->value)->firstOrFail();

        $user = User::query()->firstOrCreate(
            ['phone' => '966500000002'],
            [
                'name' => 'DIYAR Demo Vendor',
                'email' => 'vendor@diyar.local',
                'email_verified_at' => now(),
                'password' => $password,
                'status' => UserStatus::Active,
                'phone_verified_at' => now(),
            ],
        );

        $this->attachRole($user, $role);

        VendorAccount::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'business_name' => 'متجر ديار للأثاث',
                'slug' => 'diyar-furniture',
                'description' => 'أثاث منزلي عالي الجودة من ديار — حساب تجريبي.',
                'location' => 'الرياض',
                'status' => VendorAccountStatus::Active,
            ],
        );
    }

    private function seedMarketer(string $password): void
    {
        $role = Role::query()->where('name', RoleName::Marketer->value)->firstOrFail();

        $user = User::query()->firstOrCreate(
            ['phone' => '966500000011'],
            [
                'name' => 'DIYAR Demo Marketer',
                'email' => 'marketer@diyar.local',
                'email_verified_at' => now(),
                'password' => $password,
                'status' => UserStatus::Active,
                'phone_verified_at' => now(),
            ],
        );

        $this->attachRole($user, $role);
    }

    private function attachRole(User $user, Role $role): void
    {
        if (! $user->roles()->where('roles.id', $role->id)->exists()) {
            $user->roles()->attach($role->id, [
                'id' => (string) str()->uuid(),
                'status' => RoleStatus::Active->value,
            ]);
        }
    }
}
