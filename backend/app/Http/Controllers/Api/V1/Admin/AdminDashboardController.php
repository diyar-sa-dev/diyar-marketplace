<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminDashboardService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function __construct(
        private readonly AdminDashboardService $dashboard,
    ) {}

    public function show(): JsonResponse
    {
        return ApiResponse::success(data: [
            'metrics' => $this->dashboard->metrics(),
        ]);
    }
}
