<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\ShipVendorOrderRequest;
use App\Http\Requests\Dashboard\StoreManualVendorOrderRequest;
use App\Http\Resources\VendorOrderResource;
use App\Models\VendorOrder;
use App\Services\Order\VendorManualOrderService;
use App\Services\Order\VendorOrderFulfillmentService;
use App\Services\Order\VendorOrderQueryFilter;
use App\Services\Vendor\VendorAccessService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use InvalidArgumentException;

class VendorOrderController extends Controller
{
    public function __construct(
        private readonly VendorOrderFulfillmentService $fulfillment,
        private readonly VendorManualOrderService $manualOrders,
        private readonly VendorOrderQueryFilter $orderFilters,
        private readonly VendorAccessService $access,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', VendorOrder::class);

        $vendorAccount = $this->access->assertPermission($request->user(), 'orders');

        $query = VendorOrder::query()
            ->where('vendor_account_id', $vendorAccount->id)
            ->with([
                'items.product.images.mediaFile',
                'order.payment.attempts',
                'order.user',
                'order.shippingAddress',
                'shipment',
            ]);

        $status = (string) $request->query('status', 'all');
        $this->orderFilters->applyStatusFilter($query, $status);

        $paymentStatus = (string) $request->query('payment_status', 'all');
        if ($paymentStatus !== '' && $paymentStatus !== 'all') {
            $query->whereHas('order.payment', fn ($paymentQuery) => $paymentQuery->where('status', $paymentStatus));
        }

        $search = trim((string) $request->query('q', ''));
        $this->orderFilters->applySearchFilter($query, $search);

        $perPage = min(max((int) $request->query('per_page', 15), 1), 50);
        $orders = $query->latest()->paginate($perPage);

        return ApiResponse::success(data: [
            'vendor_orders' => VendorOrderResource::collection(collect($orders->items())),
            'pagination' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function store(StoreManualVendorOrderRequest $request): JsonResponse
    {
        if (! config('diyar.manual_orders.api_enabled', false)) {
            return ApiResponse::error(__('diyar.order.manual_orders_disabled'), 403);
        }

        $this->authorize('create', VendorOrder::class);

        $vendorAccount = $this->access->assertWritePermission($request->user(), 'orders');

        $vendorOrder = $this->manualOrders->create(
            $request->user(),
            $vendorAccount,
            $request->validated(),
        );

        return ApiResponse::success(
            ['vendor_order' => new VendorOrderResource($vendorOrder)],
            __('diyar.order.manual_order_created'),
            201,
        );
    }

    public function show(Request $request, VendorOrder $vendorOrder): JsonResponse
    {
        $this->authorize('view', $vendorOrder);

        $vendorOrder->load($this->vendorOrderRelations());

        return ApiResponse::success(data: [
            'vendor_order' => new VendorOrderResource($vendorOrder),
        ]);
    }

    public function invoice(Request $request, VendorOrder $vendorOrder): Response
    {
        $this->authorize('view', $vendorOrder);

        $vendorOrder->load($this->vendorOrderRelations());

        return response()->view('invoices.vendor-order', [
            'vendorOrder' => $vendorOrder,
            'order' => $vendorOrder->order,
        ]);
    }

    public function accept(Request $request, VendorOrder $vendorOrder): JsonResponse
    {
        $this->authorize('accept', $vendorOrder);

        try {
            $updated = $this->fulfillment->accept($vendorOrder);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        $updated->load($this->vendorOrderRelations());

        return ApiResponse::success(
            data: ['vendor_order' => new VendorOrderResource($updated)],
            message: __('diyar.order.vendor_order_accepted'),
        );
    }

    public function process(Request $request, VendorOrder $vendorOrder): JsonResponse
    {
        $this->authorize('process', $vendorOrder);

        try {
            $updated = $this->fulfillment->markProcessing($vendorOrder);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        $updated->load($this->vendorOrderRelations());

        return ApiResponse::success(
            data: ['vendor_order' => new VendorOrderResource($updated)],
            message: __('diyar.order.vendor_order_processing'),
        );
    }

    public function ship(ShipVendorOrderRequest $request, VendorOrder $vendorOrder): JsonResponse
    {
        $this->authorize('ship', $vendorOrder);

        try {
            $updated = $this->fulfillment->markShipped(
                $vendorOrder,
                (string) $request->validated('tracking_number'),
                $request->validated('carrier'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        $updated->load($this->vendorOrderRelations());

        return ApiResponse::success(
            data: ['vendor_order' => new VendorOrderResource($updated)],
            message: __('diyar.order.vendor_order_shipped'),
        );
    }

    public function deliver(Request $request, VendorOrder $vendorOrder): JsonResponse
    {
        $this->authorize('deliver', $vendorOrder);

        try {
            $updated = $this->fulfillment->markDelivered($vendorOrder);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        $updated->load($this->vendorOrderRelations());

        return ApiResponse::success(
            data: ['vendor_order' => new VendorOrderResource($updated)],
            message: __('diyar.order.vendor_order_delivered'),
        );
    }

    public function cancel(Request $request, VendorOrder $vendorOrder): JsonResponse
    {
        $this->authorize('cancel', $vendorOrder);

        try {
            $updated = $this->fulfillment->cancel($vendorOrder);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        $updated->load($this->vendorOrderRelations());

        return ApiResponse::success(
            data: ['vendor_order' => new VendorOrderResource($updated)],
            message: __('diyar.order.vendor_order_cancelled'),
        );
    }

    /**
     * @return list<string>
     */
    private function vendorOrderRelations(): array
    {
        return [
            'items.product.images.mediaFile',
            'items.product.category',
            'order.payment.attempts',
            'order.user',
            'order.shippingAddress',
            'vendorAccount',
            'shipment',
        ];
    }
}
