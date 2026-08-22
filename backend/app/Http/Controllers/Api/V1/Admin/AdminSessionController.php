<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Admin\AdminPermissionService;
use App\Support\Api\ApiResponse;
use App\Support\Identity\MarketplaceAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSessionController extends Controller
{
    public function __construct(
        private readonly AdminPermissionService $permissions,
    ) {}

    public function show(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user('admin');

        if ($user === null) {
            abort(401);
        }

        if (! MarketplaceAccess::canAccessAdminPanel($user)) {
            abort(403, __('diyar.auth.admin_use_operations_panel'));
        }

        $user->load(['roles', 'vendorAccount']);

        return ApiResponse::success(data: [
            'user' => new UserResource($user),
            'permissions' => $this->permissions->permissionKeysFor($user)->values()->all(),
        ]);
    }
}
