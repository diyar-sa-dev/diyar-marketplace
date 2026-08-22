<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceRequestCardResource;
use App\Http\Resources\ServiceRequestResource;
use App\Models\ServiceRequest;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminServiceRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ServiceRequest::query()->with(['user', 'providerAccount', 'service']);

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('reference', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('service_requests', ServiceRequestCardResource::collection($paginator->items()), $paginator);
    }

    public function show(ServiceRequest $serviceRequest): JsonResponse
    {
        $serviceRequest->load(['user', 'providerAccount', 'service', 'categories', 'attachments', 'offers', 'acceptedOffer', 'booking']);

        return ApiResponse::success(data: [
            'service_request' => new ServiceRequestResource($serviceRequest),
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
