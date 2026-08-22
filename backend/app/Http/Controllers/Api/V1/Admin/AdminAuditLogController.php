<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminAuditLogResource;
use App\Models\AdminAuditLog;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AdminAuditLog::query()->with('actor');

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('action', 'like', "%{$search}%")
                    ->orWhere('resource_type', 'like', "%{$search}%")
                    ->orWhere('resource_id', 'like', "%{$search}%")
                    ->orWhereHas('actor', function ($actorQuery) use ($search): void {
                        $actorQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if ($action = $request->string('action')->toString()) {
            $query->where('action', $action);
        }

        if ($resourceType = $request->string('resource_type')->toString()) {
            $query->where('resource_type', $resourceType);
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return ApiResponse::success(data: [
            'audit_logs' => AdminAuditLogResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(AdminAuditLog $auditLog): JsonResponse
    {
        $auditLog->load('actor');

        return ApiResponse::success(data: [
            'audit_log' => new AdminAuditLogResource($auditLog),
        ]);
    }
}
