<?php

namespace App\Domains\TryInRoom\Controllers;

use App\Enums\TryInRoomJobStatus;
use App\Exceptions\TryInRoom\IdempotencyConflictException;
use App\Http\Controllers\Controller;
use App\Domains\TryInRoom\Requests\StoreTryInRoomRequest;
use App\Domains\TryInRoom\Resources\TryInRoomJobResource;
use App\Models\Product;
use App\Domains\RoomDesigner\Services\RoomDesignDocumentService;
use App\Domains\TryInRoom\Services\TryInRoomJobService;
use App\Core\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

    public function result(Request $request, string $tryInRoomJob): StreamedResponse
    {
        $job = $this->jobs->findOwned($tryInRoomJob, $request->user());
        if ($job->status !== TryInRoomJobStatus::Completed) {
            abort(404);
        }

        $relative = str_replace('\\', '/', (string) ($job->result['result_path'] ?? ''));
        $disk = (string) ($job->result['result_disk'] ?? config('diyar.try_in_room.disk', 'try_in_room'));
        $ownerPrefix = ((string) $job->user_id).'/';

        if (
            $relative === ''
            || str_contains($relative, '..')
            || ! str_starts_with($relative, $ownerPrefix)
            || ! Storage::disk($disk)->exists($relative)
        ) {
            abort(404);
        }

        $mime = (string) ($job->result['result_mime'] ?? 'image/png');

        return Storage::disk($disk)->response($relative, 'try-in-room.png', [
            'Content-Type' => $mime !== '' ? $mime : 'image/png',
            'Cache-Control' => 'private, max-age=120',
            'X-Content-Type-Options' => 'nosniff',
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
