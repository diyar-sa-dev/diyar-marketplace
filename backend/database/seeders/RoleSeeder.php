<?php

namespace Database\Seeders;

use App\Enums\RoleName;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [RoleName::Customer, 'Customer'],
            [RoleName::Vendor, 'Vendor'],
            [RoleName::Provider, 'Provider'],
            [RoleName::Marketer, 'Marketer'],
            [RoleName::Admin, 'Administrator'],
        ];

        foreach ($roles as [$name, $label]) {
            Role::query()->updateOrCreate(
                ['name' => $name->value],
                ['label' => $label],
            );
        }
    }
}
