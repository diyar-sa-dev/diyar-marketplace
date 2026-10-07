<?php

namespace App\Domains\B2b\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\B2b\Requests\B2bCompanyListRequest;
use App\Domains\B2b\Resources\B2bCategoryResource;
use App\Domains\B2b\Resources\B2bCompanyCardResource;
use App\Domains\B2b\Resources\B2bCompanyDetailResource;
use App\Domains\B2b\Services\B2bQueryService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class B2bCompanyController extends Controller
{
    public function __construct(
        private readonly B2bQueryService $b2b,
    ) {}

    public function index(B2bCompanyListRequest $request): JsonResponse
    {
        $paginator = $this->b2b->listPublished($request->validatedFilters());
        $stats = $this->b2b->directoryStats();

        return ApiResponse::success(data: [
            'items' => B2bCompanyCardResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'stats' => [
                'verified_companies' => $stats['verified_companies'],
                'published_companies' => $stats['published_companies'],
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $company = $this->b2b->findPublishedBySlug($slug);
        $related = $this->b2b->relatedPublished($company);

        return ApiResponse::success(data: [
            'company' => new B2bCompanyDetailResource($company),
            'related' => B2bCompanyCardResource::collection($related)->resolve(),
        ]);
    }

    public function categories(): JsonResponse
    {
        $categories = $this->b2b->listCategories()
            ->filter(fn ($category) => ($category->published_companies_count ?? 0) > 0)
            ->values();

        return ApiResponse::success(data: [
            'categories' => B2bCategoryResource::collection($categories)->resolve(),
        ]);
    }
}
