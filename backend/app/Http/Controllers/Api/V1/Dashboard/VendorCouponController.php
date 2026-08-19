<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\StoreVendorCouponRequest;
use App\Http\Requests\Dashboard\UpdateVendorCouponRequest;
use App\Http\Resources\VendorCouponResource;
use App\Models\VendorCoupon;
use App\Services\Coupon\VendorCouponManagementService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class VendorCouponController extends Controller
{
    public function __construct(
        private readonly VendorCouponManagementService $coupons,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $page = max((int) $request->query('page', 1), 1);
        $perPage = min(max((int) $request->query('per_page', 20), 1), 50);

        $paginator = $this->coupons->listForVendor($request->user(), $page, $perPage);

        return ApiResponse::success(data: $this->paginatedCoupons($paginator));
    }

    public function store(StoreVendorCouponRequest $request): JsonResponse
    {
        try {
            $coupon = $this->coupons->create($request->user(), $request->validated());
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (ConflictHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 409);
        }

        return ApiResponse::success(
            data: ['coupon' => new VendorCouponResource($coupon)],
            message: __('diyar.coupons.created'),
            status: 201,
        );
    }

    public function show(Request $request, VendorCoupon $vendorCoupon): JsonResponse
    {
        $coupon = $this->coupons->findOwned($request->user(), $vendorCoupon->id);

        return ApiResponse::success(data: ['coupon' => new VendorCouponResource($coupon)]);
    }

    public function update(UpdateVendorCouponRequest $request, VendorCoupon $vendorCoupon): JsonResponse
    {
        try {
            $coupon = $this->coupons->update(
                $request->user(),
                $this->coupons->findOwned($request->user(), $vendorCoupon->id),
                $request->validated(),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (ConflictHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 409);
        }

        return ApiResponse::success(
            data: ['coupon' => new VendorCouponResource($coupon)],
            message: __('diyar.coupons.updated'),
        );
    }

    public function activate(Request $request, VendorCoupon $vendorCoupon): JsonResponse
    {
        $coupon = $this->coupons->setActive(
            $request->user(),
            $this->coupons->findOwned($request->user(), $vendorCoupon->id),
            true,
        );

        return ApiResponse::success(
            data: ['coupon' => new VendorCouponResource($coupon)],
            message: __('diyar.coupons.activated'),
        );
    }

    public function deactivate(Request $request, VendorCoupon $vendorCoupon): JsonResponse
    {
        $coupon = $this->coupons->setActive(
            $request->user(),
            $this->coupons->findOwned($request->user(), $vendorCoupon->id),
            false,
        );

        return ApiResponse::success(
            data: ['coupon' => new VendorCouponResource($coupon)],
            message: __('diyar.coupons.deactivated'),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function paginatedCoupons(LengthAwarePaginator $paginator): array
    {
        return [
            'items' => VendorCouponResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }
}
