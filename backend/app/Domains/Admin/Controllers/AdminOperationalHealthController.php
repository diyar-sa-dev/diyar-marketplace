<?php

namespace App\Domains\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Domains\Admin\Services\AdminOperationalHealthService;
use App\Core\Support\Api\ApiResponse;
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
