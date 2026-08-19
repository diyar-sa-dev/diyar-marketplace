<?php

namespace App\Http\Controllers\Api\V1\ServiceMarketplace;

use App\Http\Controllers\Controller;
use App\Http\Requests\ServiceMarketplace\CreateDirectBookingRequest;
use App\Http\Requests\ServiceMarketplace\DirectBookingPreviewRequest;
use App\Http\Resources\ServiceBookingResource;
use App\Services\ServiceMarketplace\DirectServiceBookingService;
use App\Services\ServiceMarketplace\ServiceCatalogService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class DirectServiceBookingController extends Controller
{
    public function __construct(
        private readonly ServiceCatalogService $catalog,
        private readonly DirectServiceBookingService $directBookings,
    ) {}

    public function preview(DirectBookingPreviewRequest $request, string $identifier): JsonResponse
    {
        $service = $this->catalog->findPublic($identifier);

        try {
            $preview = $this->directBookings->preview(
                $request->user(),
                $service,
                $request->validated(),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(data: ['preview' => $preview]);
    }

    public function store(CreateDirectBookingRequest $request, string $identifier): JsonResponse
    {
        $service = $this->catalog->findPublic($identifier);

        try {
            $booking = $this->directBookings->create(
                $request->user(),
                $service,
                $request->validated(),
                $request->validated('idempotency_key'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['booking' => new ServiceBookingResource($booking->load(['payment', 'providerAccount', 'service']))],
            message: __('diyar.services.bookings.created'),
        );
    }
}
