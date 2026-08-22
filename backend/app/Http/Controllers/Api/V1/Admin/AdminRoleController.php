<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\RoleName;
use App\Http\Controllers\Controller;
use App\Http\Resources\AdminRoleResource;
use App\Models\Role;
use App\Services\Admin\AdminRolePermissionService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AdminRoleController extends Controller
{
    public function __construct(
        private readonly AdminRolePermissionService $roles,
    ) {}

    public function index(): JsonResponse
    {
        $roles = Role::query()
            ->where('name', RoleName::Admin)
            ->with('permissions')
            ->get();

        return ApiResponse::success(data: [
            'roles' => AdminRoleResource::collection($roles),
        ]);
    }

    public function show(Role $role): JsonResponse
    {
        if ($role->name !== RoleName::Admin) {
            abort(404);
        }

        $role->load('permissions');

        return ApiResponse::success(data: [
            'role' => new AdminRoleResource($role),
        ]);
    }

    public function syncPermissions(Request $request, Role $role): JsonResponse
    {
        if ($role->name !== RoleName::Admin) {
            abort(404);
        }

        $validated = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*' => ['required', 'string'],
        ]);

        try {
            $updated = $this->roles->syncPermissions(
                role: $role,
                permissionKeys: $validated['permissions'],
                actor: $request->user('admin'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(data: [
            'role' => new AdminRoleResource($updated),
        ]);
    }
}
