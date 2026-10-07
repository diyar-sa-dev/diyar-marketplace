<?php

namespace App\Domains\ServicesMarketplace\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\ServicesMarketplace\Requests\AcceptServiceOfferRequest;
use App\Domains\ServicesMarketplace\Requests\StoreServiceOfferRequest;
use App\Domains\ServicesMarketplace\Resources\ServiceOfferResource;
use App\Domains\ServicesMarketplace\Resources\ServiceRequestCardResource;
use App\Domains\ServicesMarketplace\Resources\ServiceRequestResource;
use App\Domains\ServicesMarketplace\Services\ServiceOfferService;
use App\Http\Controllers\Controller;
use App\Models\ServiceOffer;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ServiceOfferController extends Controller
{
    public function __construct(
        private readonly ServiceOfferService $offers,
    ) {}

    public function providerInbox(Request $request): JsonResponse
    {
        $status = (string) $request->query('status', 'all');
        $page = max((int) $request->query('page', 1), 1);
        $perPage = min(max((int) $request->query('per_page', 10), 1), 20);
        $search = $request->query('q');
        $category = $request->query('category');
        $sort = $request->query('sort');

        try {
            $paginator = $this->offers->listForProvider(
                $request->user(),
                $status,
                $page,
                $perPage,
                is_string($search) ? $search : null,
                is_string($category) ? $category : null,
                is_string($sort) ? $sort : null,
            );
        } catch (NotFoundHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 404);
        }

        return ApiResponse::success(data: $this->paginatedInbox($paginator));
    }

    public function providerShow(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        try {
            $item = $this->offers->findForProvider($request->user(), $serviceRequest->id);
        } catch (NotFoundHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 404);
        } catch (HttpExceptionInterface $exception) {
            return ApiResponse::error($exception->getMessage(), $exception->getStatusCode());
        }

        return ApiResponse::success(data: [
            'service_request' => new ServiceRequestResource($item),
        ]);
    }

    public function store(
        StoreServiceOfferRequest $request,
        ServiceRequest $serviceRequest,
    ): JsonResponse {
        try {
            $offer = $this->offers->submit(
                $request->user(),
                $serviceRequest,
                $request->validated(),
                $request->file('quotation'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (HttpExceptionInterface $exception) {
            return ApiResponse::error($exception->getMessage(), $exception->getStatusCode());
        }

        return ApiResponse::success(
            data: ['offer' => new ServiceOfferResource($offer)],
            message: __('diyar.services.offers.submitted'),
            status: 201,
        );
    }

    public function accept(AcceptServiceOfferRequest $request, ServiceOffer $serviceOffer): JsonResponse
    {
        try {
            $offer = $this->offers->accept(
                $request->user(),
                $serviceOffer,
                $request->validated(),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (HttpExceptionInterface $exception) {
            return ApiResponse::error($exception->getMessage(), $exception->getStatusCode());
        }

        return ApiResponse::success(
            data: ['offer' => new ServiceOfferResource($offer->load(['booking.payment', 'providerAccount']))],
            message: __('diyar.services.offers.accepted'),
        );
    }

    public function reject(Request $request, ServiceOffer $serviceOffer): JsonResponse
    {
        try {
            $offer = $this->offers->reject($request->user(), $serviceOffer);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (HttpExceptionInterface $exception) {
            return ApiResponse::error($exception->getMessage(), $exception->getStatusCode());
        }

        return ApiResponse::success(
            data: ['offer' => new ServiceOfferResource($offer)],
            message: __('diyar.services.offers.rejected'),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function paginatedInbox(LengthAwarePaginator $paginator): array
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
