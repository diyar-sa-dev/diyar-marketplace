<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminShipmentResource;
use App\Models\Shipment;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminShipmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Shipment::query()->with('vendorOrder');

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('tracking_number', 'like', "%{$search}%")
                    ->orWhere('carrier', 'like', "%{$search}%");
            });
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('shipments', AdminShipmentResource::collection($paginator->items()), $paginator);
    }

    public function show(Shipment $shipment): JsonResponse
    {
        $shipment->load(['vendorOrder.vendorAccount', 'vendorOrder.order']);

        return ApiResponse::success(data: [
            'shipment' => new AdminShipmentResource($shipment),
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
