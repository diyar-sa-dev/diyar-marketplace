<?php

namespace App\Domains\Vendors\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Vendors\Services\VendorAccessService;
use App\Domains\Vendors\Services\VendorDashboardOverviewService;
use App\Http\Controllers\Controller;
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
