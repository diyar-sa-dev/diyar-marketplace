<?php

namespace App\Http\Controllers\Api\V1\ServiceMarketplace;

use App\Http\Controllers\Controller;
use App\Http\Requests\ServiceMarketplace\SimulateServiceBookingPaymentRequest;
use App\Http\Resources\ServiceBookingPaymentResource;
use App\Http\Resources\ServiceBookingResource;
use App\Models\ServiceBooking;
use App\Services\ServiceMarketplace\ServiceBookingPaymentService;
use App\Support\Api\ApiResponse;
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
