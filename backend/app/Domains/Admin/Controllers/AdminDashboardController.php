<?php

namespace App\Domains\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Domains\Admin\Services\AdminDashboardService;
use App\Core\Support\Api\ApiResponse;
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
