<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBlogTagRequest;
use App\Http\Requests\Admin\UpdateBlogTagRequest;
use App\Http\Resources\BlogTagResource;
use App\Models\BlogTag;
use App\Models\User;
use App\Services\Blog\AdminBlogService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class AdminBlogTagController extends Controller
{
    public function __construct(
        private readonly AdminBlogService $blog,
    ) {}

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', BlogTag::class);

        $tags = BlogTag::query()->orderBy('name')->get();

        return ApiResponse::success(data: [
            'tags' => BlogTagResource::collection($tags),
        ]);
    }

    public function store(StoreBlogTagRequest $request): JsonResponse
    {
        $this->authorize('create', BlogTag::class);

        $tag = $this->blog->createTag(
            $request->validated(),
            $this->adminActor($request),
        );

        return ApiResponse::success(
            data: ['tag' => new BlogTagResource($tag)],
            status: 201,
        );
    }

    public function show(string $tag): JsonResponse
    {
        $model = $this->findTag($tag);
        $this->authorize('view', $model);

        return ApiResponse::success(data: [
            'tag' => new BlogTagResource($model),
        ]);
    }

    public function update(UpdateBlogTagRequest $request, string $tag): JsonResponse
    {
        $model = $this->findTag($tag);
        $this->authorize('update', $model);

        $updated = $this->blog->updateTag(
            $model,
            $request->validated(),
            $this->adminActor($request),
        );

        return ApiResponse::success(data: [
            'tag' => new BlogTagResource($updated),
        ]);
    }

    public function destroy(Request $request, string $tag): JsonResponse
    {
        $model = $this->findTag($tag);
        $this->authorize('delete', $model);

        $this->blog->deleteTag($model, $this->adminActor($request));

        return ApiResponse::success();
    }

    private function findTag(string $tag): BlogTag
    {
        $model = BlogTag::query()->find($tag);

        if ($model === null) {
            throw new NotFoundHttpException(__('diyar.blog.tag_not_found'));
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
