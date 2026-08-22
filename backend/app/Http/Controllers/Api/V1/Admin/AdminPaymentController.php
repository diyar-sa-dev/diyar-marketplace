<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminPaymentResource;
use App\Models\Payment;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminPaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Payment::query()->with('order');

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('payment_reference', 'like', "%{$search}%")
                    ->orWhere('gateway_payment_id', 'like', "%{$search}%")
                    ->orWhereHas('order', fn ($order) => $order->where('order_number', 'like', "%{$search}%"));
            });
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('payments', AdminPaymentResource::collection($paginator->items()), $paginator);
    }

    public function show(Payment $payment): JsonResponse
    {
        $payment->load(['order.user', 'vendorAllocations']);

        return ApiResponse::success(data: [
            'payment' => new AdminPaymentResource($payment),
        ]);
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
