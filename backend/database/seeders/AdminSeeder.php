<?php

namespace Database\Seeders;

use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\Concerns\UsesDemoPassword;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    use UsesDemoPassword;

    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $adminRole = Role::query()->where('name', RoleName::Admin->value)->firstOrFail();

        $admin = User::query()->firstOrCreate(
            ['phone' => '966500000001'],
            [
                'name' => 'DIYAR Admin',
                'email' => 'admin@diyar.local',
                'email_verified_at' => now(),
                'password' => $this->demoPassword(),
                'status' => UserStatus::Active,
                'phone_verified_at' => now(),
            ],
        );

        if (! $admin->roles()->where('roles.id', $adminRole->id)->exists()) {
            $admin->roles()->attach($adminRole->id, [
                'id' => (string) str()->uuid(),
                'status' => RoleStatus::Active->value,
            ]);
        }
    }
}
