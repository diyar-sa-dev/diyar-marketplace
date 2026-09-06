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
    /** @return list<AdminPermission> */
    private function permissions(): array
    {
        return [
            AdminPermission::FeedbackView,
            AdminPermission::FeedbackManage,
        ];
    }

    public function up(): void
    {
        $adminRole = Role::query()->where('name', RoleName::Admin->value)->first();

        foreach ($this->permissions() as $permissionCase) {
            $permission = Permission::query()->updateOrCreate(
                ['key' => $permissionCase->value],
                [
                    'group' => $permissionCase->group(),
                    'label' => $permissionCase->value,
                    'description' => null,
                ],
            );

            if ($adminRole !== null && ! $adminRole->permissions()->where('permissions.id', $permission->id)->exists()) {
                $adminRole->permissions()->attach($permission->id, [
                    'id' => (string) Str::uuid(),
                ]);
            }
        }

        app(AdminPermissionService::class)->forgetAll();
    }

    public function down(): void
    {
        foreach ($this->permissions() as $permissionCase) {
            $permission = Permission::query()->where('key', $permissionCase->value)->first();
            if ($permission !== null) {
                $permission->roles()->detach();
                $permission->delete();
            }
        }

        app(AdminPermissionService::class)->forgetAll();
    }
};
