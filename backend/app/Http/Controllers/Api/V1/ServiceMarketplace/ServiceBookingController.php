<?php

namespace App\Http\Controllers\Api\V1\ServiceMarketplace;

use App\Http\Controllers\Controller;
use App\Http\Requests\ServiceMarketplace\ProposeServiceBookingScheduleRequest;
use App\Http\Resources\ServiceBookingResource;
use App\Models\ServiceBooking;
use App\Services\ServiceMarketplace\ServiceBookingService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ServiceBookingController extends Controller
{
    public function __construct(
        private readonly ServiceBookingService $bookings,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $page = max((int) $request->query('page', 1), 1);
        $perPage = min(max((int) $request->query('per_page', 10), 1), 20);

        $paginator = $this->bookings->listForCustomer($request->user(), $page, $perPage);

        return ApiResponse::success(data: $this->paginatedBookings($paginator));
    }

    public function show(Request $request, ServiceBooking $serviceBooking): JsonResponse
    {
        try {
            $booking = $this->bookings->findForParticipant($request->user(), $serviceBooking->id);
        } catch (HttpExceptionInterface $exception) {
            return ApiResponse::error($exception->getMessage(), $exception->getStatusCode());
        }

        return ApiResponse::success(data: [
            'booking' => new ServiceBookingResource($booking),
        ]);
    }

    public function start(Request $request, ServiceBooking $serviceBooking): JsonResponse
    {
        try {
            $booking = $this->bookings->markInProgress($request->user(), $serviceBooking);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (HttpExceptionInterface $exception) {
            return ApiResponse::error($exception->getMessage(), $exception->getStatusCode());
        }

        return ApiResponse::success(
            data: ['booking' => new ServiceBookingResource($booking)],
            message: __('diyar.services.bookings.started'),
        );
    }

    public function complete(Request $request, ServiceBooking $serviceBooking): JsonResponse
    {
        try {
            $booking = $this->bookings->markCompleted($request->user(), $serviceBooking);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (HttpExceptionInterface $exception) {
            return ApiResponse::error($exception->getMessage(), $exception->getStatusCode());
        }

        return ApiResponse::success(
            data: ['booking' => new ServiceBookingResource($booking)],
            message: __('diyar.services.bookings.completed'),
        );
    }

    public function cancel(Request $request, ServiceBooking $serviceBooking): JsonResponse
    {
        try {
            $booking = $this->bookings->cancelByProvider($request->user(), $serviceBooking);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (HttpExceptionInterface $exception) {
            return ApiResponse::error($exception->getMessage(), $exception->getStatusCode());
        }

        return ApiResponse::success(
            data: ['booking' => new ServiceBookingResource($booking)],
            message: __('diyar.services.bookings.cancelled'),
        );
    }

    public function confirm(Request $request, ServiceBooking $serviceBooking): JsonResponse
    {
        try {
            $booking = $this->bookings->confirmByProvider($request->user(), $serviceBooking);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (HttpExceptionInterface $exception) {
            return ApiResponse::error($exception->getMessage(), $exception->getStatusCode());
        }

        return ApiResponse::success(
            data: ['booking' => new ServiceBookingResource($booking)],
            message: __('diyar.services.bookings.confirmed'),
        );
    }

    public function proposeSchedule(
        ProposeServiceBookingScheduleRequest $request,
        ServiceBooking $serviceBooking,
    ): JsonResponse {
        try {
            $booking = $this->bookings->proposeRescheduleByProvider(
                $request->user(),
                $serviceBooking,
                $request->validated(),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (HttpExceptionInterface $exception) {
            return ApiResponse::error($exception->getMessage(), $exception->getStatusCode());
        }

        return ApiResponse::success(
            data: ['booking' => new ServiceBookingResource($booking)],
            message: __('diyar.services.bookings.schedule_proposed'),
        );
    }

    public function acceptSchedule(Request $request, ServiceBooking $serviceBooking): JsonResponse
    {
        try {
            $booking = $this->bookings->acceptScheduleByCustomer($request->user(), $serviceBooking);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (HttpExceptionInterface $exception) {
            return ApiResponse::error($exception->getMessage(), $exception->getStatusCode());
        }

        return ApiResponse::success(
            data: ['booking' => new ServiceBookingResource($booking)],
            message: __('diyar.services.bookings.schedule_accepted'),
        );
    }

    public function declineSchedule(Request $request, ServiceBooking $serviceBooking): JsonResponse
    {
        try {
            $booking = $this->bookings->declineScheduleByCustomer($request->user(), $serviceBooking);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (HttpExceptionInterface $exception) {
            return ApiResponse::error($exception->getMessage(), $exception->getStatusCode());
        }

        return ApiResponse::success(
            data: ['booking' => new ServiceBookingResource($booking)],
            message: __('diyar.services.bookings.schedule_declined'),
        );
    }

    public function cancelAsCustomer(Request $request, ServiceBooking $serviceBooking): JsonResponse
    {
        try {
            $booking = $this->bookings->cancelByCustomer($request->user(), $serviceBooking);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (HttpExceptionInterface $exception) {
            return ApiResponse::error($exception->getMessage(), $exception->getStatusCode());
        }

        return ApiResponse::success(
            data: ['booking' => new ServiceBookingResource($booking)],
            message: __('diyar.services.bookings.cancelled'),
        );
    }

    public function providerIndex(Request $request): JsonResponse
    {
        $page = max((int) $request->query('page', 1), 1);
        $perPage = min(max((int) $request->query('per_page', 10), 1), 20);
        $status = $request->query('status');
        $search = $request->query('q');

        try {
            $paginator = $this->bookings->listForProvider(
                $request->user(),
                $page,
                $perPage,
                is_string($status) ? $status : null,
                is_string($search) ? $search : null,
            );
        } catch (NotFoundHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 404);
        }

        return ApiResponse::success(data: $this->paginatedBookings($paginator));
    }

    /**
     * @return array<string, mixed>
     */
    private function paginatedBookings(LengthAwarePaginator $paginator): array
    {
        return [
            'items' => ServiceBookingResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }
}
