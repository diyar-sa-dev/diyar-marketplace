<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Returns\UpdateVendorReturnPolicyRequest;
use App\Http\Resources\VendorReturnPolicyResource;
use App\Models\VendorReturnPolicy;
use App\Services\Returns\VendorReturnPolicyService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorReturnPolicyController extends Controller
{
    public function __construct(
        private readonly VendorReturnPolicyService $policies,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $this->authorize('view', VendorReturnPolicy::class);

        $model = $this->policies->getForAuthenticatedVendor($request->user());

        return ApiResponse::success(data: [
            'return_policy' => $model !== null ? new VendorReturnPolicyResource($model) : null,
        ]);
    }

    public function update(UpdateVendorReturnPolicyRequest $request): JsonResponse
    {
        $this->authorize('update', VendorReturnPolicy::class);

        $model = $this->policies->upsert($request->user(), $request->validated());

        return ApiResponse::success(
            data: ['return_policy' => new VendorReturnPolicyResource($model)],
            message: __('diyar.returns.policy_saved'),
        );
    }
}
