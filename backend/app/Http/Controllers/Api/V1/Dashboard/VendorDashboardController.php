<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\Vendor\VendorDashboardOverviewService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorDashboardController extends Controller
{
    public function __construct(
        private readonly VendorDashboardOverviewService $overview,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        $vendorAccount = $request->user()->vendorAccount;

        if ($vendorAccount === null) {
            return ApiResponse::error(__('diyar.auth.forbidden'), 403);
        }

        return ApiResponse::success([
            'overview' => $this->overview->overview($vendorAccount),
        ]);
    }
}
