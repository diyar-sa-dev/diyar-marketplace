<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminPermissionResource;
use App\Models\Permission;
use App\Support\Api\ApiResponse;
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
