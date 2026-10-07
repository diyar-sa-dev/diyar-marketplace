<?php

namespace App\Domains\Projects\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Projects\Requests\ProjectListRequest;
use App\Domains\Projects\Resources\ProjectCardResource;
use App\Domains\Projects\Resources\ProjectDetailResource;
use App\Domains\Projects\Services\ProjectQueryService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

class ProjectController extends Controller
{
    public function __construct(
        private readonly ProjectQueryService $projects,
    ) {}

    public function index(ProjectListRequest $request): JsonResponse
    {
        $paginator = $this->projects->listPublished($request->validatedFilters());

        return ApiResponse::success(data: $this->paginatedProjects($paginator));
    }

    public function show(string $slug): JsonResponse
    {
        $project = $this->projects->findPublishedBySlug($slug);

        return ApiResponse::success(data: [
            'project' => new ProjectDetailResource($project),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function paginatedProjects(LengthAwarePaginator $paginator): array
    {
        return [
            'items' => ProjectCardResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }
}
