<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\AdminPermission;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UploadCmsImageRequest;
use App\Services\Admin\AdminPermissionService;
use App\Services\Media\MediaUploadService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;

class AdminCmsMediaController extends Controller
{
    public function __construct(
        private readonly MediaUploadService $media,
        private readonly AdminPermissionService $permissions,
    ) {}

    public function uploadImage(UploadCmsImageRequest $request): JsonResponse
    {
        $context = $request->contextKey();
        $requiredPermission = $this->requiredPermission($context);

        if (! $this->permissions->has($request->user('admin'), $requiredPermission)) {
            abort(403, __('diyar.auth.forbidden'));
        }

        $directory = config('diyar_media.cms_directories.'.$context)
            ?? config('diyar_media.default_cms_directory', 'cms/misc');

        try {
            $path = $this->media->storeCmsImage(
                user: $request->user('admin'),
                file: $request->file('image'),
                directory: (string) $directory,
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(data: [
            'path' => $path,
            'url' => $this->media->url($path),
        ]);
    }

    private function requiredPermission(string $context): AdminPermission
    {
        return match ($context) {
            'project_cover', 'project_gallery' => AdminPermission::ProjectsManage,
            default => AdminPermission::BlogManage,
        };
    }
}
