<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\VendorCouponResource;
use App\Models\VendorCoupon;
use App\Services\Admin\AdminCouponService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminCouponController extends Controller
{
    public function __construct(
        private readonly AdminCouponService $coupons,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = VendorCoupon::query()->with('vendorAccount');

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('code', 'like', "%{$search}%")
                    ->orWhereHas('vendorAccount', fn ($vendor) => $vendor->where('business_name', 'like', "%{$search}%"));
            });
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('coupons', VendorCouponResource::collection($paginator->items()), $paginator);
    }

    public function show(VendorCoupon $coupon): JsonResponse
    {
        $coupon->load(['vendorAccount', 'usages']);

        return ApiResponse::success(data: [
            'coupon' => new VendorCouponResource($coupon),
        ]);
    }

    public function activate(Request $request, VendorCoupon $coupon): JsonResponse
    {
        $updated = $this->coupons->activate(
            coupon: $coupon,
            actor: $request->user('admin'),
            reason: $request->string('reason')->toString() ?: null,
        );

        return ApiResponse::success(data: ['coupon' => new VendorCouponResource($updated)]);
    }

    public function deactivate(Request $request, VendorCoupon $coupon): JsonResponse
    {
        $updated = $this->coupons->deactivate(
            coupon: $coupon,
            actor: $request->user('admin'),
            reason: $request->string('reason')->toString() ?: null,
        );

        return ApiResponse::success(data: ['coupon' => new VendorCouponResource($updated)]);
    }

    /**
     * @param  mixed  $items
     */
    private function paginated(string $key, $items, LengthAwarePaginator $paginator): JsonResponse
    {
        return ApiResponse::success(data: [
            $key => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}
