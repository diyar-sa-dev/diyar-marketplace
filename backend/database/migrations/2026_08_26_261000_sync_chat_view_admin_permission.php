<?php

use App\Enums\AdminPermission;
use App\Enums\RoleName;
use App\Models\Permission;
use App\Models\Role;
use App\Services\Admin\AdminPermissionService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $chatView = AdminPermission::ChatView;

        $permission = Permission::query()->updateOrCreate(
            ['key' => $chatView->value],
            [
                'group' => $chatView->group(),
                'label' => $chatView->value,
                'description' => null,
            ],
        );

        $adminRole = Role::query()->where('name', RoleName::Admin->value)->first();

        if ($adminRole !== null && ! $adminRole->permissions()->where('permissions.id', $permission->id)->exists()) {
            $adminRole->permissions()->attach($permission->id, [
                'id' => (string) Str::uuid(),
            ]);
        }

        app(AdminPermissionService::class)->forgetAll();
    }

    public function down(): void
    {
        $permission = Permission::query()->where('key', AdminPermission::ChatView->value)->first();

        if ($permission !== null) {
            $permission->roles()->detach();
            $permission->delete();
        }

        app(AdminPermissionService::class)->forgetAll();
    }
};
