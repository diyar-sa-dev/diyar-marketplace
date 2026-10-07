<?php

namespace App\Domains\ServicesMarketplace\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\ServicesMarketplace\Requests\SimulateServiceBookingPaymentRequest;
use App\Domains\ServicesMarketplace\Resources\ServiceBookingPaymentResource;
use App\Domains\ServicesMarketplace\Resources\ServiceBookingResource;
use App\Domains\ServicesMarketplace\Services\ServiceBookingPaymentService;
use App\Http\Controllers\Controller;
use App\Models\ServiceBooking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class ServiceBookingPaymentController extends Controller
{
    public function __construct(
        private readonly ServiceBookingPaymentService $payments,
    ) {}

    public function show(Request $request, ServiceBooking $serviceBooking): JsonResponse
    {
        try {
            $result = $this->payments->initiate($request->user(), $serviceBooking);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (HttpExceptionInterface $exception) {
            return ApiResponse::error($exception->getMessage(), $exception->getStatusCode());
        }

        return ApiResponse::success(data: [
            'payment' => new ServiceBookingPaymentResource($result['payment']),
            'booking' => new ServiceBookingResource($result['booking']),
        ]);
    }

    public function simulate(
        SimulateServiceBookingPaymentRequest $request,
        ServiceBooking $serviceBooking,
    ): JsonResponse {
        try {
            $booking = $this->payments->simulate(
                $request->user(),
                $serviceBooking,
                $request->validated('outcome'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (HttpExceptionInterface $exception) {
            return ApiResponse::error($exception->getMessage(), $exception->getStatusCode());
        }

        return ApiResponse::success(data: [
            'booking' => new ServiceBookingResource($booking),
        ]);
    }
}
