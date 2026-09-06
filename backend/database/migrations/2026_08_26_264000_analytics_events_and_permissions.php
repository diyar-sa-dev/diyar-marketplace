<?php

use App\Enums\AdminPermission;
use App\Enums\RoleName;
use App\Models\Permission;
use App\Models\Role;
use App\Services\Admin\AdminPermissionService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /** @return list<AdminPermission> */
    private function permissions(): array
    {
        return [
            AdminPermission::AnalyticsView,
            AdminPermission::AnalyticsViewFinancial,
            AdminPermission::AnalyticsExport,
        ];
    }

    public function up(): void
    {
        Schema::create('analytics_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('event_type', 64)->index();
            $table->string('subject_type', 64)->nullable();
            $table->uuid('subject_id')->nullable();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('session_id', 64)->nullable()->index();
            $table->foreignUuid('vendor_account_id')->nullable()->constrained('vendor_accounts')->nullOnDelete();
            $table->foreignUuid('provider_account_id')->nullable()->constrained('provider_accounts')->nullOnDelete();
            $table->json('payload')->nullable();
            $table->timestamp('created_at')->index();

            $table->index(['event_type', 'created_at']);
            $table->index(['vendor_account_id', 'event_type', 'created_at'], 'analytics_vendor_event_time');
        });

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
        Schema::dropIfExists('analytics_events');

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
