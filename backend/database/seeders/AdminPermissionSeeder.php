<?php

namespace Database\Seeders;

use App\Enums\AdminPermission;
use App\Enums\RoleName;
use App\Models\Permission;
use App\Models\Role;
use App\Services\Admin\AdminPermissionService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AdminPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $adminRole = Role::query()->where('name', RoleName::Admin->value)->first();

        if ($adminRole === null) {
            return;
        }

        foreach (AdminPermission::all() as $permission) {
            $model = Permission::query()->updateOrCreate(
                ['key' => $permission->value],
                [
                    'group' => $permission->group(),
                    'label' => $permission->value,
                    'description' => null,
                ],
            );

            if (! $adminRole->permissions()->where('permissions.id', $model->id)->exists()) {
                $adminRole->permissions()->attach($model->id, [
                    'id' => (string) Str::uuid(),
                ]);
            }
        }

        app(AdminPermissionService::class)->forgetAll();
    }
}
