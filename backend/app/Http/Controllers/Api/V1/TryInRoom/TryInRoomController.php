<?php

namespace App\Http\Controllers\Api\V1\TryInRoom;

use App\Exceptions\TryInRoom\IdempotencyConflictException;
use App\Http\Controllers\Controller;
use App\Http\Requests\TryInRoom\StoreTryInRoomRequest;
use App\Http\Resources\TryInRoomJobResource;
use App\Models\Product;
use App\Models\RoomDesign;
use App\Services\RoomDesign\RoomDesignDocumentService;
use App\Services\TryInRoom\TryInRoomJobService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class TryInRoomController extends Controller
{
    public function __construct(
        private readonly TryInRoomJobService $jobs,
        private readonly RoomDesignDocumentService $roomDesigns,
    ) {}

    public function storeForProduct(StoreTryInRoomRequest $request, Product $product): JsonResponse
    {
        try {
            $job = $this->jobs->createFromProductUpload(
                user: $request->user(),
                product: $product,
                photo: $request->file('photo'),
                idempotencyKey: $request->idempotencyKey(),
            );
        } catch (IdempotencyConflictException $exception) {
            return $this->conflictError($exception);
        } catch (InvalidArgumentException $exception) {
            return $this->validationError($exception);
        }

        Log::info('try_in_room.started', [
            'job_id' => $job->id,
            'user_id' => $request->user()->id,
            'product_id' => $product->id,
        ]);

        return ApiResponse::success(
            data: ['try_in_room_job' => new TryInRoomJobResource($job)],
            message: __('diyar.try_in_room.created'),
            status: 201,
        );
    }

    public function storeForRoomDesign(StoreTryInRoomRequest $request, string $roomDesign): JsonResponse
    {
        $design = $this->roomDesigns->findOwned($roomDesign, $request->user());
        $this->authorize('view', $design);

        try {
            $job = $this->jobs->createFromRoomDesignUpload(
                user: $request->user(),
                design: $design,
                photo: $request->file('photo'),
                idempotencyKey: $request->idempotencyKey(),
            );
        } catch (IdempotencyConflictException $exception) {
            return $this->conflictError($exception);
        } catch (InvalidArgumentException $exception) {
            return $this->validationError($exception);
        }

        Log::info('try_in_room.started', [
            'job_id' => $job->id,
            'user_id' => $request->user()->id,
            'room_design_id' => $design->id,
        ]);

        return ApiResponse::success(
            data: ['try_in_room_job' => new TryInRoomJobResource($job)],
            message: __('diyar.try_in_room.created'),
            status: 201,
        );
    }

    public function show(Request $request, string $tryInRoomJob): JsonResponse
    {
        $job = $this->jobs->findOwned($tryInRoomJob, $request->user());

        return ApiResponse::success(data: [
            'try_in_room_job' => new TryInRoomJobResource($job),
        ]);
    }

    private function validationError(InvalidArgumentException $exception): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $exception->getMessage(),
            'code' => 'validation_failed',
        ], 422);
    }

    private function conflictError(IdempotencyConflictException $exception): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $exception->getMessage(),
            'code' => 'idempotency_conflict',
        ], 409);
    }
}
