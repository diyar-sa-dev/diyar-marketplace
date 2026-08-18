<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductPreorderRequestResource;
use App\Models\ProductPreorderRequest;
use App\Services\Catalog\ProductPreorderService;
use App\Services\Vendor\VendorAccessService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class VendorPreorderController extends Controller
{
    public function __construct(
        private readonly ProductPreorderService $preorders,
        private readonly VendorAccessService $access,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $vendorAccount = $this->access->assertPermission($request->user(), 'orders');

        $paginator = $this->preorders->paginateForVendor(
            $vendorAccount,
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 15),
            $request->query('status'),
        );

        return ApiResponse::success(data: [
            'items' => ProductPreorderRequestResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'summary' => [
                'pending' => $this->preorders->countPendingForVendor($vendorAccount->id),
            ],
        ]);
    }

    public function cancel(Request $request, ProductPreorderRequest $preorder): JsonResponse
    {
        $vendorAccount = $this->access->assertPermission($request->user(), 'orders');

        try {
            $updated = $this->preorders->cancelForVendor($request->user(), $vendorAccount, $preorder);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['preorder' => new ProductPreorderRequestResource($updated)],
            message: __('diyar.preorder.cancelled'),
        );
    }
}
