<?php

namespace App\Domains\Returns\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Returns\Requests\UpdateVendorReturnPolicyRequest;
use App\Domains\Returns\Resources\VendorReturnPolicyResource;
use App\Domains\Returns\Services\VendorReturnPolicyService;
use App\Http\Controllers\Controller;
use App\Models\VendorReturnPolicy;
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
