<?php

namespace App\Services\RoomDesign;

use App\Exceptions\RoomDesign\RoomDesignVersionConflictException;
use App\Models\RoomDesign;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class RoomDesignDocumentService
{
    public function __construct(
        private readonly RoomDesignValidator $validator,
    ) {}

    /**
     * @param  array<string, mixed>  $document
     */
    public function create(User $user, array $document, ?string $title = null): RoomDesign
    {
        $normalized = $this->validator->validateDocument($document);

        $design = new RoomDesign;
        $design->forceFill([
            'user_id' => $user->id,
            'title' => $title,
            'document' => $normalized,
            'schema_version' => (int) $normalized['schema_version'],
            'item_count' => count($normalized['items']),
            'version' => 1,
        ])->save();

        Log::info('room_design.create', [
            'room_design_id' => $design->id,
            'user_id' => $user->id,
            'item_count' => $design->item_count,
        ]);

        return $design;
    }

    public function findOwned(string $id, User $user): RoomDesign
    {
        $design = RoomDesign::query()->whereKey($id)->first();
        if ($design === null || $design->user_id !== $user->id) {
            throw new NotFoundHttpException(__('diyar.auth.not_found'));
        }

        return $design;
    }

    /**
     * @return LengthAwarePaginator<int, RoomDesign>
     */
    public function paginateForUser(User $user, int $page, int $perPage): LengthAwarePaginator
    {
        return RoomDesign::query()
            ->where('user_id', $user->id)
            ->orderByDesc('updated_at')
            ->paginate(perPage: $perPage, page: $page);
    }

    /**
     * @param  array<string, mixed>  $document
     */
    public function replaceDocument(RoomDesign $design, User $user, array $document, int $expectedVersion): RoomDesign
    {
        if ($design->user_id !== $user->id) {
            throw new NotFoundHttpException(__('diyar.auth.not_found'));
        }

        $normalized = $this->validator->validateDocument($document);

        return DB::transaction(function () use ($design, $normalized, $expectedVersion, $user) {
            /** @var RoomDesign|null $locked */
            $locked = RoomDesign::query()->whereKey($design->id)->lockForUpdate()->first();
            if ($locked === null) {
                throw new NotFoundHttpException(__('diyar.auth.not_found'));
            }

            if ((int) $locked->version !== $expectedVersion) {
                Log::info('room_design.save_conflict', [
                    'room_design_id' => $locked->id,
                    'user_id' => $user->id,
                    'expected_version' => $expectedVersion,
                    'server_version' => $locked->version,
                ]);
                throw new RoomDesignVersionConflictException($locked);
            }

            $locked->forceFill([
                'document' => $normalized,
                'schema_version' => (int) $normalized['schema_version'],
                'item_count' => count($normalized['items']),
                'version' => $locked->version + 1,
            ])->save();

            Log::info('room_design.update', [
                'room_design_id' => $locked->id,
                'user_id' => $user->id,
                'version' => $locked->version,
                'item_count' => $locked->item_count,
            ]);

            return $locked->fresh();
        });
    }

    public function updateTitle(RoomDesign $design, User $user, ?string $title): RoomDesign
    {
        if ($design->user_id !== $user->id) {
            throw new NotFoundHttpException(__('diyar.auth.not_found'));
        }

        $design->forceFill(['title' => $title])->save();

        return $design->fresh();
    }

    public function delete(RoomDesign $design, User $user): void
    {
        if ($design->user_id !== $user->id) {
            throw new NotFoundHttpException(__('diyar.auth.not_found'));
        }

        $design->delete();

        Log::info('room_design.delete', [
            'room_design_id' => $design->id,
            'user_id' => $user->id,
        ]);
    }
}
