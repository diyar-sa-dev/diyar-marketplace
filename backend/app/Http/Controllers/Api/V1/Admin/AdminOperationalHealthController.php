<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminOperationalHealthService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;

class AdminOperationalHealthController extends Controller
{
    public function __construct(
        private readonly AdminOperationalHealthService $health,
    ) {}

    public function show(): JsonResponse
    {
        return ApiResponse::success(data: $this->health->buildPayload());
    }
}
