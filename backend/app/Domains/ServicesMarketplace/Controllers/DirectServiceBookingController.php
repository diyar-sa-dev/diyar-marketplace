<?php

namespace App\Domains\ServicesMarketplace\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\ServicesMarketplace\Requests\CreateDirectBookingRequest;
use App\Domains\ServicesMarketplace\Requests\DirectBookingPreviewRequest;
use App\Domains\ServicesMarketplace\Resources\ServiceBookingResource;
use App\Domains\ServicesMarketplace\Services\DirectServiceBookingService;
use App\Domains\ServicesMarketplace\Services\ServiceCatalogService;
use App\Http\Controllers\Controller;
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
