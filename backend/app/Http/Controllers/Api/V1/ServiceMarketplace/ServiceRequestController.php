<?php

namespace App\Http\Controllers\Api\V1\ServiceMarketplace;

use App\Http\Controllers\Controller;
use App\Http\Requests\ServiceMarketplace\StoreServiceRequestAttachmentRequest;
use App\Http\Requests\ServiceMarketplace\StoreServiceRequestRequest;
use App\Http\Resources\ServiceRequestAttachmentResource;
use App\Http\Resources\ServiceRequestCardResource;
use App\Http\Resources\ServiceRequestResource;
use App\Models\ServiceRequest;
use App\Services\ServiceMarketplace\ServiceRequestAttachmentService;
use App\Services\ServiceMarketplace\ServiceRequestService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ServiceRequestController extends Controller
{
    public function __construct(
        private readonly ServiceRequestService $requests,
        private readonly ServiceRequestAttachmentService $attachments,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $status = (string) $request->query('status', 'all');
        $page = max((int) $request->query('page', 1), 1);
        $perPage = min(max((int) $request->query('per_page', 10), 1), 20);

        $paginator = $this->requests->listForCustomer($request->user(), $status, $page, $perPage);

        return ApiResponse::success(data: $this->paginatedRequests($paginator));
    }

    public function store(StoreServiceRequestRequest $request): JsonResponse
    {
        try {
            $serviceRequest = $this->requests->create($request->user(), $request->validated());
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['service_request' => new ServiceRequestResource($serviceRequest)],
            message: __('diyar.services.requests.created'),
            status: 201,
        );
    }

    public function show(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        try {
            $item = $this->requests->findForCustomer($request->user(), $serviceRequest->id);
        } catch (NotFoundHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 404);
        }

        return ApiResponse::success(data: [
            'service_request' => new ServiceRequestResource($item),
        ]);
    }

    public function cancel(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        try {
            $item = $this->requests->cancel($request->user(), $serviceRequest);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['service_request' => new ServiceRequestResource($item)],
            message: __('diyar.services.requests.cancelled'),
        );
    }

    public function storeAttachment(
        StoreServiceRequestAttachmentRequest $request,
        ServiceRequest $serviceRequest,
    ): JsonResponse {
        try {
            $this->requests->findForCustomer($request->user(), $serviceRequest->id);
            $attachment = $this->attachments->store(
                $request->user(),
                $serviceRequest,
                $request->file('file'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['attachment' => new ServiceRequestAttachmentResource($attachment)],
            status: 201,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function paginatedRequests(LengthAwarePaginator $paginator): array
    {
        return [
            'items' => ServiceRequestCardResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }
}
