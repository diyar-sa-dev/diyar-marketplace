<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProjectRequest;
use App\Http\Requests\Admin\UpdateProjectRequest;
use App\Http\Resources\ProjectCardResource;
use App\Http\Resources\ProjectDetailResource;
use App\Models\Project;
use App\Models\User;
use App\Services\Projects\AdminProjectService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class AdminProjectController extends Controller
{
    public function __construct(
        private readonly AdminProjectService $projects,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Project::class);

        $query = Project::query()->with(['images']);

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        $paginator = $query->orderByDesc('updated_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('projects', ProjectCardResource::collection($paginator->items()), $paginator);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $this->authorize('create', Project::class);

        $project = $this->projects->create(
            $request->validated(),
            $this->adminActor($request),
        );

        return ApiResponse::success(
            data: ['project' => new ProjectDetailResource($project)],
            status: 201,
        );
    }

    public function show(string $project): JsonResponse
    {
        $model = $this->findProject($project);
        $this->authorize('view', $model);

        return ApiResponse::success(data: [
            'project' => new ProjectDetailResource($model),
        ]);
    }

    public function update(UpdateProjectRequest $request, string $project): JsonResponse
    {
        $model = $this->findProject($project);
        $this->authorize('update', $model);

        $updated = $this->projects->update(
            $model,
            $request->validated(),
            $this->adminActor($request),
        );

        return ApiResponse::success(data: [
            'project' => new ProjectDetailResource($updated),
        ]);
    }

    public function destroy(Request $request, string $project): JsonResponse
    {
        $model = $this->findProject($project);
        $this->authorize('delete', $model);

        $this->projects->delete($model, $this->adminActor($request));

        return ApiResponse::success();
    }

    public function publish(Request $request, string $project): JsonResponse
    {
        $model = $this->findProject($project);
        $this->authorize('publish', $model);

        $updated = $this->projects->publish($model, $this->adminActor($request));

        return ApiResponse::success(data: [
            'project' => new ProjectDetailResource($updated),
        ]);
    }

    public function unpublish(Request $request, string $project): JsonResponse
    {
        $model = $this->findProject($project);
        $this->authorize('unpublish', $model);

        $updated = $this->projects->unpublish($model, $this->adminActor($request));

        return ApiResponse::success(data: [
            'project' => new ProjectDetailResource($updated),
        ]);
    }

    public function archive(Request $request, string $project): JsonResponse
    {
        $model = $this->findProject($project);
        $this->authorize('archive', $model);

        $updated = $this->projects->archive($model, $this->adminActor($request));

        return ApiResponse::success(data: [
            'project' => new ProjectDetailResource($updated),
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

    private function findProject(string $project): Project
    {
        $model = Project::query()->with('images')->find($project);

        if ($model === null) {
            throw new NotFoundHttpException(__('diyar.projects.not_found'));
        }

        return $model;
    }

    private function adminActor(Request $request): User
    {
        /** @var User $admin */
        $admin = $request->user('admin');

        return $admin;
    }
}
