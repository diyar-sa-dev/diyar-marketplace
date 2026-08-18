<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\Vendor\VendorAccessService;
use App\Services\Vendor\VendorDashboardOverviewService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorDashboardController extends Controller
{
    public function __construct(
        private readonly VendorDashboardOverviewService $overview,
        private readonly VendorAccessService $access,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        $vendorAccount = $this->access->assertPermission($request->user(), 'dashboard');

        return ApiResponse::success([
            'overview' => $this->overview->overview($vendorAccount),
        ]);
    }
}
