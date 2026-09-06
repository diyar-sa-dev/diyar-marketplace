<?php

namespace App\Http\Controllers\Api\V1\Projects;

use App\Http\Controllers\Controller;
use App\Http\Requests\Projects\ProjectListRequest;
use App\Http\Resources\ProjectCardResource;
use App\Http\Resources\ProjectDetailResource;
use App\Services\Projects\ProjectQueryService;
use App\Support\Api\ApiResponse;
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
