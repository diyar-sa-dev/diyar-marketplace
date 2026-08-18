<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreProductPreorderRequest;
use App\Http\Resources\ProductPreorderRequestResource;
use App\Services\Catalog\ProductPreorderService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class ProductPreorderController extends Controller
{
    public function __construct(
        private readonly ProductPreorderService $preorders,
    ) {}

    public function store(StoreProductPreorderRequest $request, string $id): JsonResponse
    {
        $product = $this->preorders->findPublicProduct($id);

        try {
            $preorder = $this->preorders->submit(
                $request->user(),
                $product,
                $request->validated('selected_color'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (AccessDeniedHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 403);
        } catch (ConflictHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 409);
        }

        return ApiResponse::success(
            data: ['preorder' => new ProductPreorderRequestResource($preorder)],
            message: __('diyar.preorder.submitted'),
            status: 201,
        );
    }

    public function status(StoreProductPreorderRequest $request, string $id): JsonResponse
    {
        $product = $this->preorders->findPublicProduct($id);
        $pending = $this->preorders->findPendingForUser($request->user(), $product);

        return ApiResponse::success(data: [
            'has_pending' => $pending !== null,
            'preorder' => $pending !== null ? new ProductPreorderRequestResource($pending) : null,
        ]);
    }
}
