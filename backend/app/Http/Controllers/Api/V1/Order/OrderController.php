<?php

namespace App\Http\Controllers\Api\V1\Order;

use App\Http\Controllers\Controller;
use App\Http\Requests\Checkout\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\Order\OrderCancellationService;
use App\Services\Order\OrderCreationService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderCreationService $orderCreation,
        private readonly OrderCancellationService $orderCancellation,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Order::class);

        $orders = Order::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'vendorOrders.vendorAccount',
                'vendorOrders.shipment',
                'vendorOrders.items.product.images.mediaFile',
                'payment',
            ])
            ->latest()
            ->paginate(15);

        return ApiResponse::success(data: [
            'orders' => OrderResource::collection(collect($orders->items())),
            'pagination' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        try {
            $result = $this->orderCreation->create(
                user: $request->user(),
                shippingAddressId: $request->validated('shipping_address_id'),
                deliverySelections: $request->validated('vendor_delivery_selections'),
                idempotencyKey: $request->idempotencyKey(),
                payloadHash: $request->payloadHash(),
                vendorCoupons: $request->validated('vendor_coupons') ?? [],
            );
        } catch (ConflictHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 409);
        } catch (UnprocessableEntityHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['order' => new OrderResource($result['order'])],
            message: __('diyar.order.created'),
            status: $result['created'] ? 201 : 200,
        );
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $this->authorize('view', $order);

        $order->load([
            'vendorOrders.items.product.images.mediaFile',
            'vendorOrders.vendorAccount',
            'vendorOrders.shipment',
            'payment',
        ]);

        return ApiResponse::success(data: [
            'order' => new OrderResource($order),
        ]);
    }

    public function cancel(Request $request, Order $order): JsonResponse
    {
        $this->authorize('cancel', $order);

        try {
            $updated = $this->orderCancellation->cancel($order);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        $updated->load(['vendorOrders.items', 'vendorOrders.vendorAccount', 'payment']);

        return ApiResponse::success(
            data: ['order' => new OrderResource($updated)],
            message: __('diyar.order.cancelled'),
        );
    }
}
