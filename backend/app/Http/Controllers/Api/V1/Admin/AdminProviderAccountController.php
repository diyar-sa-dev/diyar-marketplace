<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminProviderAccountResource;
use App\Models\ProviderAccount;
use App\Services\Admin\AdminProviderAccountService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AdminProviderAccountController extends Controller
{
    public function __construct(
        private readonly AdminProviderAccountService $providers,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = ProviderAccount::query()->with('user');

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('business_name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return ApiResponse::success(data: [
            'provider_accounts' => AdminProviderAccountResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(ProviderAccount $providerAccount): JsonResponse
    {
        $providerAccount->load('user');

        return ApiResponse::success(data: [
            'provider_account' => new AdminProviderAccountResource($providerAccount),
        ]);
    }

    public function suspend(Request $request, ProviderAccount $providerAccount): JsonResponse
    {
        $updated = $this->providers->suspend(
            account: $providerAccount,
            actor: $request->user('admin'),
            reason: $request->string('reason')->toString() ?: null,
        );

        return ApiResponse::success(data: ['provider_account' => new AdminProviderAccountResource($updated)]);
    }

    public function activate(Request $request, ProviderAccount $providerAccount): JsonResponse
    {
        try {
            $updated = $this->providers->activate(
                account: $providerAccount,
                actor: $request->user('admin'),
                reason: $request->string('reason')->toString() ?: null,
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(data: ['provider_account' => new AdminProviderAccountResource($updated)]);
    }
}
