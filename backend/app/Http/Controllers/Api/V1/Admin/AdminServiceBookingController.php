<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceBookingResource;
use App\Models\ServiceBooking;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminServiceBookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ServiceBooking::query()->with(['user', 'providerAccount', 'service']);

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('reference', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('service_bookings', ServiceBookingResource::collection($paginator->items()), $paginator);
    }

    public function show(ServiceBooking $serviceBooking): JsonResponse
    {
        $serviceBooking->load(['user', 'providerAccount', 'service', 'serviceOffer', 'serviceRequest', 'payment', 'providerReview']);

        return ApiResponse::success(data: [
            'service_booking' => new ServiceBookingResource($serviceBooking),
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
