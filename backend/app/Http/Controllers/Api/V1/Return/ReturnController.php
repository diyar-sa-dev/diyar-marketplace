<?php

namespace App\Http\Controllers\Api\V1\Return;

use App\Http\Controllers\Controller;
use App\Http\Requests\Returns\StoreReturnEvidenceRequest;
use App\Http\Requests\Returns\StoreReturnRequest;
use App\Http\Resources\EffectiveReturnPolicyResource;
use App\Http\Resources\ReturnEvidenceResource;
use App\Http\Resources\ReturnRequestResource;
use App\Models\OrderItem;
use App\Models\ReturnRequest;
use App\Models\VendorOrder;
use App\Services\Returns\ReturnEligibilityService;
use App\Services\Returns\ReturnEvidenceService;
use App\Services\Returns\ReturnRequestService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class ReturnController extends Controller
{
    public function __construct(
        private readonly ReturnRequestService $returns,
        private readonly ReturnEligibilityService $eligibility,
        private readonly ReturnEvidenceService $evidence,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ReturnRequest::class);

        $perPage = min(max((int) $request->query('per_page', 15), 1), 50);

        $returns = ReturnRequest::query()
            ->where('user_id', $request->user()->id)
            ->with(['items.orderItem', 'refund', 'vendorOrder.vendorAccount', 'order'])
            ->latest()
            ->paginate($perPage);

        return ApiResponse::success(data: [
            'returns' => ReturnRequestResource::collection(collect($returns->items())),
            'pagination' => [
                'current_page' => $returns->currentPage(),
                'last_page' => $returns->lastPage(),
                'per_page' => $returns->perPage(),
                'total' => $returns->total(),
            ],
        ]);
    }

    public function store(StoreReturnRequest $request): JsonResponse
    {
        $this->authorize('create', ReturnRequest::class);

        try {
            $returnRequest = $this->returns->create($request->user(), $request->validated());
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['return_request' => new ReturnRequestResource($returnRequest->load(['items.orderItem', 'vendorOrder.vendorAccount', 'order']))],
            message: __('diyar.returns.created'),
            status: 201,
        );
    }

    public function show(Request $request, ReturnRequest $returnRequest): JsonResponse
    {
        $this->authorize('view', $returnRequest);

        $returnRequest->load(['items.orderItem', 'refund', 'vendorOrder.vendorAccount', 'order', 'evidence']);

        return ApiResponse::success(data: [
            'return_request' => new ReturnRequestResource($returnRequest),
        ]);
    }

    public function storeEvidence(StoreReturnEvidenceRequest $request, ReturnRequest $returnRequest): JsonResponse
    {
        $this->authorize('view', $returnRequest);

        if ($returnRequest->user_id !== $request->user()->id) {
            return ApiResponse::error(__('diyar.auth.forbidden'), 403);
        }

        try {
            $evidence = $this->evidence->store(
                $request->user(),
                $returnRequest,
                $request->file('file'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['evidence' => new ReturnEvidenceResource($evidence)],
            message: __('diyar.returns.evidence_uploaded'),
            status: 201,
        );
    }

    public function eligibility(Request $request, VendorOrder $vendorOrder, OrderItem $orderItem): JsonResponse
    {
        if ($orderItem->vendor_order_id !== $vendorOrder->id) {
            return ApiResponse::error(__('diyar.returns.item_not_in_vendor_order'), 404);
        }

        if ($vendorOrder->order?->user_id !== $request->user()->id) {
            return ApiResponse::error(__('diyar.auth.forbidden'), 403);
        }

        $evaluation = $this->eligibility->evaluateItem($vendorOrder, $orderItem);

        return ApiResponse::success(data: [
            'eligible' => $evaluation['eligible'],
            'deadline' => $evaluation['deadline'],
            'remaining_quantity' => $evaluation['remaining_quantity'],
            'accepted_reasons' => $evaluation['reasons'],
            'policy' => new EffectiveReturnPolicyResource($evaluation['policy']),
        ]);
    }
}
