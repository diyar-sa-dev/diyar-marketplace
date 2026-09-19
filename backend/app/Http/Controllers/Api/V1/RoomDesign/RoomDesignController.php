<?php

namespace App\Http\Controllers\Api\V1\RoomDesign;

use App\Exceptions\RoomDesign\RoomDesignPayloadTooLargeException;
use App\Exceptions\RoomDesign\RoomDesignVersionConflictException;
use App\Http\Controllers\Controller;
use App\Http\Requests\RoomDesign\AddRoomDesignToCartRequest;
use App\Http\Requests\RoomDesign\ListRoomDesignsRequest;
use App\Http\Requests\RoomDesign\PatchRoomDesignRequest;
use App\Http\Requests\RoomDesign\StoreRoomDesignRequest;
use App\Http\Requests\RoomDesign\UpdateRoomDesignRequest;
use App\Http\Resources\CartResource;
use App\Http\Resources\RoomDesignListItemResource;
use App\Http\Resources\RoomDesignResource;
use App\Models\RoomDesign;
use App\Services\RoomDesign\RoomDesignCartService;
use App\Services\RoomDesign\RoomDesignDocumentService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class RoomDesignController extends Controller
{
    public function __construct(
        private readonly RoomDesignDocumentService $designs,
        private readonly RoomDesignCartService $designCart,
    ) {}

    public function index(ListRoomDesignsRequest $request): JsonResponse
    {
        $this->authorize('viewAny', RoomDesign::class);

        $paginator = $this->designs->paginateForUser(
            $request->user(),
            $request->page(),
            $request->perPage(),
        );

        return ApiResponse::success(data: [
            'items' => RoomDesignListItemResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(StoreRoomDesignRequest $request): JsonResponse
    {
        $this->authorize('create', RoomDesign::class);

        try {
            $design = $this->designs->create(
                user: $request->user(),
                document: $request->input('document'),
                title: $request->input('title'),
            );
        } catch (RoomDesignPayloadTooLargeException $exception) {
            return $this->payloadTooLargeResponse();
        } catch (ValidationException $exception) {
            return $this->validationFailedResponse($exception);
        }

        return ApiResponse::success(
            data: ['room_design' => new RoomDesignResource($design)],
            message: __('diyar.room_designer.created'),
            status: 201,
        );
    }

    public function show(Request $request, string $roomDesign): JsonResponse
    {
        $model = $this->designs->findOwned($roomDesign, $request->user());
        $this->authorize('view', $model);

        return ApiResponse::success(data: [
            'room_design' => new RoomDesignResource($model),
        ]);
    }

    public function update(UpdateRoomDesignRequest $request, string $roomDesign): JsonResponse
    {
        $model = $this->designs->findOwned($roomDesign, $request->user());
        $this->authorize('update', $model);

        try {
            $updated = $this->designs->replaceDocument(
                design: $model,
                user: $request->user(),
                document: $request->input('document'),
                expectedVersion: (int) $request->input('expected_version'),
            );
        } catch (RoomDesignVersionConflictException $exception) {
            return $this->versionConflictResponse($exception);
        } catch (RoomDesignPayloadTooLargeException) {
            return $this->payloadTooLargeResponse();
        } catch (ValidationException $exception) {
            Log::info('room_design.save_failure', [
                'room_design_id' => $model->id,
                'user_id' => $request->user()->id,
                'reason' => 'validation',
            ]);

            return $this->validationFailedResponse($exception);
        }

        return ApiResponse::success(
            data: ['room_design' => new RoomDesignResource($updated)],
            message: __('diyar.room_designer.updated'),
        );
    }

    public function patch(PatchRoomDesignRequest $request, string $roomDesign): JsonResponse
    {
        $model = $this->designs->findOwned($roomDesign, $request->user());
        $this->authorize('update', $model);

        $updated = $this->designs->updateTitle(
            design: $model,
            user: $request->user(),
            title: $request->input('title'),
        );

        return ApiResponse::success(data: [
            'room_design' => new RoomDesignResource($updated),
        ]);
    }

    public function destroy(Request $request, string $roomDesign): JsonResponse
    {
        $model = $this->designs->findOwned($roomDesign, $request->user());
        $this->authorize('delete', $model);

        $this->designs->delete($model, $request->user());

        return ApiResponse::success(message: __('diyar.room_designer.deleted'));
    }

    public function addToCart(AddRoomDesignToCartRequest $request, string $roomDesign): JsonResponse
    {
        $model = $this->designs->findOwned($roomDesign, $request->user());
        $this->authorize('view', $model);

        try {
            $result = $this->designCart->addDesignToCart(
                user: $request->user(),
                designId: $roomDesign,
                roomItemIds: $request->roomItemIds(),
            );
        } catch (ValidationException $exception) {
            return $this->validationFailedResponse($exception);
        }

        Log::info('room_design.add_to_cart', [
            'room_design_id' => $roomDesign,
            'user_id' => $request->user()->id,
            'skipped_count' => count($result['skipped']),
        ]);

        return ApiResponse::success(
            data: [
                'cart' => new CartResource($result['cart']),
                'skipped' => $result['skipped'],
            ],
            message: __('diyar.room_designer.cart.added'),
        );
    }

    private function validationFailedResponse(ValidationException $exception): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => __('diyar.room_designer.validation_failed'),
            'code' => 'validation_failed',
            'errors' => $exception->errors(),
        ], 422);
    }

    private function payloadTooLargeResponse(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => __('diyar.room_designer.payload_too_large'),
            'code' => 'payload_too_large',
        ], 413);
    }

    private function versionConflictResponse(RoomDesignVersionConflictException $exception): JsonResponse
    {
        $design = $exception->design;

        return response()->json([
            'success' => false,
            'message' => $exception->getMessage(),
            'code' => 'version_conflict',
            'server_version' => $design->version,
            'data' => [
                'id' => $design->id,
                'version' => $design->version,
                'updated_at' => $design->updated_at?->toIso8601String(),
            ],
        ], 409);
    }
}
