<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Admin\AdminUserService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function __construct(
        private readonly AdminUserService $users,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with('roles');

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return ApiResponse::success(data: [
            'users' => UserResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(User $user): JsonResponse
    {
        $user->load(['roles', 'vendorAccount', 'providerAccount']);

        return ApiResponse::success(data: [
            'user' => new UserResource($user),
        ]);
    }

    public function suspend(Request $request, User $user): JsonResponse
    {
        $updated = $this->users->suspend(
            user: $user,
            actor: $request->user('admin'),
            reason: $request->string('reason')->toString() ?: null,
        );

        return ApiResponse::success(data: ['user' => new UserResource($updated)]);
    }

    public function activate(Request $request, User $user): JsonResponse
    {
        $updated = $this->users->activate(
            user: $user,
            actor: $request->user('admin'),
            reason: $request->string('reason')->toString() ?: null,
        );

        return ApiResponse::success(data: ['user' => new UserResource($updated)]);
    }
}
