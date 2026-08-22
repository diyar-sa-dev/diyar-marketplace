<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReturnRequestResource;
use App\Models\ReturnRequest;
use App\Services\Admin\AdminReturnService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminReturnController extends Controller
{
    public function __construct(
        private readonly AdminReturnService $returns,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = ReturnRequest::query()->with(['user', 'order', 'vendorOrder']);

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('reference', 'like', "%{$search}%")
                    ->orWhereHas('order', fn ($order) => $order->where('order_number', 'like', "%{$search}%"));
            });
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('return_requests', ReturnRequestResource::collection($paginator->items()), $paginator);
    }

    public function show(ReturnRequest $returnRequest): JsonResponse
    {
        $returnRequest->load(['user', 'order', 'vendorOrder', 'items', 'evidence', 'refund']);

        return ApiResponse::success(data: [
            'return_request' => new ReturnRequestResource($returnRequest),
        ]);
    }

    public function approve(Request $request, ReturnRequest $returnRequest): JsonResponse
    {
        $updated = $this->returns->approve(
            returnRequest: $returnRequest,
            actor: $request->user('admin'),
            note: $request->string('note')->toString() ?: null,
        );

        return ApiResponse::success(data: ['return_request' => new ReturnRequestResource($updated)]);
    }

    public function reject(Request $request, ReturnRequest $returnRequest): JsonResponse
    {
        $updated = $this->returns->reject(
            returnRequest: $returnRequest,
            actor: $request->user('admin'),
            note: $request->string('note')->toString() ?: null,
        );

        return ApiResponse::success(data: ['return_request' => new ReturnRequestResource($updated)]);
    }

    public function markReceived(Request $request, ReturnRequest $returnRequest): JsonResponse
    {
        $updated = $this->returns->markReceived($returnRequest, $request->user('admin'));

        return ApiResponse::success(data: ['return_request' => new ReturnRequestResource($updated)]);
    }

    public function markInspected(Request $request, ReturnRequest $returnRequest): JsonResponse
    {
        $updated = $this->returns->markInspected($returnRequest, $request->user('admin'));

        return ApiResponse::success(data: ['return_request' => new ReturnRequestResource($updated)]);
    }

    public function processRefund(Request $request, ReturnRequest $returnRequest): JsonResponse
    {
        $validated = $request->validate([
            'idempotency_key' => ['required', 'string', 'max:128'],
        ]);

        $updated = $this->returns->processRefund(
            returnRequest: $returnRequest,
            actor: $request->user('admin'),
            idempotencyKey: $validated['idempotency_key'],
        );

        return ApiResponse::success(data: ['return_request' => new ReturnRequestResource($updated)]);
    }

    /**
     * @param  mixed  $items
     */
    private function paginated(string $key, $items, LengthAwarePaginator $paginator): JsonResponse
    {
        return ApiResponse::success(data: [
            $key => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}
