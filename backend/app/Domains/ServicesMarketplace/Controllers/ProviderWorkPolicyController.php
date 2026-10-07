<?php

namespace App\Domains\ServicesMarketplace\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\ServicesMarketplace\Requests\UpdateProviderWorkPolicyRequest;
use App\Domains\ServicesMarketplace\Resources\ProviderWorkPolicyResource;
use App\Domains\ServicesMarketplace\Services\ProviderWorkPolicyService;
use App\Http\Controllers\Controller;
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
