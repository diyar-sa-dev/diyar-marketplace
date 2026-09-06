<?php

namespace App\Http\Controllers\Api\V1\B2b;

use App\Http\Controllers\Controller;
use App\Http\Requests\B2b\StoreB2bLeadRequest;
use App\Http\Resources\B2bLeadResource;
use App\Models\B2bLead;
use App\Models\User;
use App\Services\B2b\B2bLeadService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class B2bLeadController extends Controller
{
    public function __construct(
        private readonly B2bLeadService $leads,
    ) {}

    public function store(StoreB2bLeadRequest $request, string $slug): JsonResponse
    {
        $company = $this->leads->resolvePublishedCompany($slug);

        /** @var User $user */
        $user = $request->user();

        $lead = $this->leads->createLead($company, $user, $request->validated());

        return ApiResponse::success(
            data: ['lead' => new B2bLeadResource($lead)],
            status: 201,
        );
    }

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $paginator = B2bLead::query()
            ->with(['company.category', 'company.tags'])
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate(min(max((int) $request->integer('per_page', 20), 1), 50));

        return ApiResponse::success(data: [
            'items' => B2bLeadResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(Request $request, string $lead): JsonResponse
    {
        $model = B2bLead::query()
            ->with(['company.category', 'company.tags', 'user'])
            ->findOrFail($lead);

        $this->authorize('view', $model);

        return ApiResponse::success(data: [
            'lead' => new B2bLeadResource($model),
        ]);
    }
}
