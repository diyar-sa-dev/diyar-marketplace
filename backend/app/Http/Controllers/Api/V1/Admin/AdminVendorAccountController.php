<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminVendorAccountResource;
use App\Models\VendorAccount;
use App\Services\Admin\AdminVendorAccountService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AdminVendorAccountController extends Controller
{
    public function __construct(
        private readonly AdminVendorAccountService $vendors,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = VendorAccount::query()->with('user');

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
            'vendor_accounts' => AdminVendorAccountResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(VendorAccount $vendorAccount): JsonResponse
    {
        $vendorAccount->load('user');

        return ApiResponse::success(data: [
            'vendor_account' => new AdminVendorAccountResource($vendorAccount),
        ]);
    }

    public function suspend(Request $request, VendorAccount $vendorAccount): JsonResponse
    {
        $updated = $this->vendors->suspend(
            account: $vendorAccount,
            actor: $request->user('admin'),
            reason: $request->string('reason')->toString() ?: null,
        );

        return ApiResponse::success(data: ['vendor_account' => new AdminVendorAccountResource($updated)]);
    }

    public function activate(Request $request, VendorAccount $vendorAccount): JsonResponse
    {
        try {
            $updated = $this->vendors->activate(
                account: $vendorAccount,
                actor: $request->user('admin'),
                reason: $request->string('reason')->toString() ?: null,
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(data: ['vendor_account' => new AdminVendorAccountResource($updated)]);
    }
}
