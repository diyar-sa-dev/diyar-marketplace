<?php

namespace App\Domains\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Domains\Admin\Resources\AdminPermissionResource;
use App\Models\Permission;
use App\Core\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;

class AdminPermissionController extends Controller
{
    public function index(): JsonResponse
    {
        $permissions = Permission::query()->orderBy('group')->orderBy('key')->get();

        return ApiResponse::success(data: [
            'permissions' => AdminPermissionResource::collection($permissions),
        ]);
    }
}
