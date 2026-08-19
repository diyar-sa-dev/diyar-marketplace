<?php

namespace App\Http\Controllers\Api\V1\ServiceMarketplace;

use App\Http\Controllers\Controller;
use App\Http\Requests\ServiceMarketplace\UpdateProviderWorkPolicyRequest;
use App\Http\Resources\ProviderWorkPolicyResource;
use App\Services\ServiceMarketplace\ProviderWorkPolicyService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProviderWorkPolicyController extends Controller
{
    public function __construct(
        private readonly ProviderWorkPolicyService $policies,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $model = $this->policies->getForAuthenticatedProvider($request->user());

        return ApiResponse::success(data: [
            'work_policy' => $model !== null ? new ProviderWorkPolicyResource($model) : null,
        ]);
    }

    public function update(UpdateProviderWorkPolicyRequest $request): JsonResponse
    {
        $model = $this->policies->upsert($request->user(), $request->validated());

        return ApiResponse::success(
            data: ['work_policy' => new ProviderWorkPolicyResource($model)],
            message: __('diyar.services.settings.work_policy_saved'),
        );
    }
}
