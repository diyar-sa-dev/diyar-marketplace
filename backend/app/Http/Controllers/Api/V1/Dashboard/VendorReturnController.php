<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Returns\ProcessReturnRefundRequest;
use App\Http\Requests\Returns\RejectReturnRequest;
use App\Http\Resources\ReturnRequestResource;
use App\Models\ReturnRequest;
use App\Services\Returns\ReturnRequestService;
use App\Services\Vendor\VendorAccessService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class VendorReturnController extends Controller
{
    public function __construct(
        private readonly ReturnRequestService $returns,
        private readonly VendorAccessService $access,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ReturnRequest::class);

        $vendorAccount = $this->access->assertPermission($request->user(), 'returns');

        $perPage = min(max((int) $request->query('per_page', 15), 1), 50);
        $status = (string) $request->query('status', 'all');

        $query = ReturnRequest::query()
            ->whereHas('vendorOrder', fn ($q) => $q->where('vendor_account_id', $vendorAccount->id))
            ->with(['items.orderItem', 'refund', 'order', 'vendorOrder.vendorAccount', 'evidence']);

        if ($status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        $returns = $query->latest()->paginate($perPage);

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

    public function show(Request $request, ReturnRequest $returnRequest): JsonResponse
    {
        $this->authorize('manage', $returnRequest);

        $returnRequest->load(['items.orderItem', 'refund', 'order', 'vendorOrder.vendorAccount', 'evidence']);

        return ApiResponse::success(data: [
            'return_request' => new ReturnRequestResource($returnRequest),
        ]);
    }

    public function submitForReview(Request $request, ReturnRequest $returnRequest): JsonResponse
    {
        $this->authorize('manage', $returnRequest);

        try {
            $updated = $this->returns->submitForReview($returnRequest);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['return_request' => new ReturnRequestResource($updated->load(['items.orderItem', 'refund']))],
            message: __('diyar.returns.submitted_for_review'),
        );
    }

    public function approve(Request $request, ReturnRequest $returnRequest): JsonResponse
    {
        $this->authorize('manage', $returnRequest);

        try {
            $updated = $this->returns->approve($returnRequest, $request->input('vendor_note'));
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['return_request' => new ReturnRequestResource($updated->load(['items.orderItem', 'refund']))],
            message: __('diyar.returns.approved'),
        );
    }

    public function reject(RejectReturnRequest $request, ReturnRequest $returnRequest): JsonResponse
    {
        $this->authorize('manage', $returnRequest);

        try {
            $updated = $this->returns->reject($returnRequest, $request->validated('vendor_note'));
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['return_request' => new ReturnRequestResource($updated->load(['items.orderItem', 'refund']))],
            message: __('diyar.returns.rejected'),
        );
    }

    public function received(Request $request, ReturnRequest $returnRequest): JsonResponse
    {
        $this->authorize('manage', $returnRequest);

        try {
            $updated = $this->returns->markReceived($returnRequest);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['return_request' => new ReturnRequestResource($updated->load(['items.orderItem', 'refund']))],
            message: __('diyar.returns.received'),
        );
    }

    public function inspect(Request $request, ReturnRequest $returnRequest): JsonResponse
    {
        $this->authorize('manage', $returnRequest);

        try {
            $updated = $this->returns->markInspected($returnRequest);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['return_request' => new ReturnRequestResource($updated->load(['items.orderItem', 'refund']))],
            message: __('diyar.returns.inspected'),
        );
    }

    public function refund(ProcessReturnRefundRequest $request, ReturnRequest $returnRequest): JsonResponse
    {
        $this->authorize('manage', $returnRequest);

        try {
            $updated = $this->returns->processRefund($returnRequest, $request->validated('idempotency_key'));
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['return_request' => new ReturnRequestResource($updated->load(['items.orderItem', 'refund', 'order', 'vendorOrder']))],
            message: __('diyar.returns.refunded'),
        );
    }
}
