<?php

namespace App\Services\TryInRoom;

use App\Enums\TryInRoomJobStatus;
use App\Exceptions\TryInRoom\IdempotencyConflictException;
use App\Jobs\TryInRoom\ProcessTryInRoomJob;
use App\Models\Product;
use App\Models\RoomDesign;
use App\Models\TryInRoomJob;
use App\Models\User;
use App\Services\RoomDesign\RoomDesignDocumentService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class TryInRoomJobService
{
    public function __construct(
        private readonly TryInRoomStorageService $storage,
        private readonly RoomDesignDocumentService $roomDesigns,
    ) {}

    public function findOwned(string $jobId, User $user): TryInRoomJob
    {
        $job = TryInRoomJob::query()->where('id', $jobId)->where('user_id', $user->id)->first();
        if ($job === null) {
            abort(404);
        }

        return $this->expireIfNeeded($job);
    }

    public function findForProcessing(string $jobId): ?TryInRoomJob
    {
        $job = TryInRoomJob::query()->find($jobId);
        if ($job === null) {
            return null;
        }

        return $this->expireIfNeeded($job);
    }

    public function createFromProductUpload(
        User $user,
        Product $product,
        UploadedFile $photo,
        ?string $idempotencyKey = null,
    ): TryInRoomJob {
        if (! Product::query()->whereKey($product->id)->publiclyVisible()->exists()) {
            throw new InvalidArgumentException(__('diyar.try_in_room.product_not_available'));
        }

        return $this->createJob($user, $photo, $product->id, null, $idempotencyKey);
    }

    public function createFromRoomDesignUpload(
        User $user,
        RoomDesign $design,
        UploadedFile $photo,
        ?string $idempotencyKey = null,
    ): TryInRoomJob {
        $this->roomDesigns->findOwned($design->id, $user);

        return $this->createJob($user, $photo, null, $design->id, $idempotencyKey);
    }

    private function createJob(
        User $user,
        UploadedFile $photo,
        ?string $productId,
        ?string $roomDesignId,
        ?string $idempotencyKey,
    ): TryInRoomJob {
        $normalizedKey = $this->normalizeIdempotencyKey($idempotencyKey);
        // Idempotency: the client-owned key identifies the logical operation (retries).
        // Same key + same product/design context returns the original job even if image bytes differ.
        if ($normalizedKey !== null) {
            $existing = TryInRoomJob::query()
                ->where('user_id', $user->id)
                ->where('idempotency_key', $normalizedKey)
                ->first();
            if ($existing !== null) {
                $this->assertIdempotencyPayloadMatch($existing, $productId, $roomDesignId);

                return $existing;
            }
        }

        $maxActive = (int) config('diyar.try_in_room.max_active_jobs_per_user', 20);
        $activeCount = TryInRoomJob::query()
            ->where('user_id', $user->id)
            ->whereIn('status', [TryInRoomJobStatus::Queued, TryInRoomJobStatus::Processing])
            ->count();
        if ($activeCount >= $maxActive) {
            throw new InvalidArgumentException(__('diyar.try_in_room.too_many_active_jobs'));
        }

        $ttlHours = (int) config('diyar.try_in_room.job_ttl_hours', 72);

        try {
            return DB::transaction(function () use ($user, $photo, $productId, $roomDesignId, $normalizedKey, $ttlHours) {
                $source = $this->storage->storeUpload($user, $photo);

                $job = new TryInRoomJob([
                    'user_id' => $user->id,
                    'source_image_id' => $source->id,
                    'product_id' => $productId,
                    'room_design_id' => $roomDesignId,
                    'idempotency_key' => $normalizedKey,
                    'queued_at' => now(),
                    'expires_at' => now()->addHours($ttlHours),
                ]);
                $job->forceFill(['status' => TryInRoomJobStatus::Queued])->save();

                DB::afterCommit(function () use ($job) {
                    ProcessTryInRoomJob::dispatch($job->id);
                });

                return $job->fresh();
            });
        } catch (UniqueConstraintViolationException) {
            if ($normalizedKey === null) {
                throw new InvalidArgumentException(__('diyar.try_in_room.too_many_active_jobs'));
            }

            $existing = TryInRoomJob::query()
                ->where('user_id', $user->id)
                ->where('idempotency_key', $normalizedKey)
                ->first();

            if ($existing === null) {
                throw new InvalidArgumentException(__('diyar.try_in_room.request_failed'));
            }

            $this->assertIdempotencyPayloadMatch($existing, $productId, $roomDesignId);

            return $existing;
        }
    }

    /**
     * Atomically claim a queued job for processing. Returns true only for the worker
     * that transitions queued → processing (prevents duplicate provider execution).
     */
    public function claimForProcessing(TryInRoomJob $job): bool
    {
        if ($job->status !== TryInRoomJobStatus::Queued) {
            return false;
        }

        $updated = TryInRoomJob::query()
            ->whereKey($job->id)
            ->where('status', TryInRoomJobStatus::Queued->value)
            ->update([
                'status' => TryInRoomJobStatus::Processing->value,
                'started_at' => now(),
                'attempts' => DB::raw('attempts + 1'),
            ]);

        return $updated === 1;
    }

    public function markProcessing(TryInRoomJob $job): TryInRoomJob
    {
        if (
            $job->status === TryInRoomJobStatus::Completed
            || $job->status === TryInRoomJobStatus::Failed
            || $job->status === TryInRoomJobStatus::Processing
        ) {
            return $job;
        }

        if (! $job->status->canTransitionTo(TryInRoomJobStatus::Processing)) {
            throw new InvalidArgumentException('invalid_status_transition');
        }

        $job->forceFill([
            'status' => TryInRoomJobStatus::Processing,
            'started_at' => $job->started_at ?? now(),
            'attempts' => $job->attempts + 1,
        ])->save();

        return $job->fresh();
    }

    public function markCompleted(TryInRoomJob $job, array $result, ?string $providerKey = null): TryInRoomJob
    {
        if ($job->status === TryInRoomJobStatus::Completed) {
            return $job;
        }

        if (! $job->status->canTransitionTo(TryInRoomJobStatus::Completed)) {
            throw new InvalidArgumentException('invalid_status_transition');
        }

        $metadata = [
            'completed_at' => now()->toIso8601String(),
        ];

        $job->forceFill([
            'status' => TryInRoomJobStatus::Completed,
            'result' => $result,
            'provider_key' => $providerKey,
            'provider_metadata' => $metadata,
            'completed_at' => now(),
            'error_code' => null,
        ])->save();

        return $job->fresh();
    }

    public function markFailed(TryInRoomJob $job, string $errorCode): TryInRoomJob
    {
        if ($job->status === TryInRoomJobStatus::Failed) {
            return $job;
        }

        if (! $job->status->canTransitionTo(TryInRoomJobStatus::Failed)) {
            throw new InvalidArgumentException('invalid_status_transition');
        }

        $job->forceFill([
            'status' => TryInRoomJobStatus::Failed,
            'error_code' => $errorCode,
            'failed_at' => now(),
        ])->save();

        return $job->fresh();
    }

    private function normalizeIdempotencyKey(?string $key): ?string
    {
        if ($key === null) {
            return null;
        }

        $trimmed = trim($key);
        if ($trimmed === '' || strlen($trimmed) > 128) {
            throw new InvalidArgumentException(__('diyar.try_in_room.invalid_idempotency_key'));
        }

        return $trimmed;
    }

    private function assertIdempotencyPayloadMatch(
        TryInRoomJob $existing,
        ?string $productId,
        ?string $roomDesignId,
    ): void {
        $productMatches = $existing->product_id === $productId;
        $designMatches = $existing->room_design_id === $roomDesignId;

        if (! $productMatches || ! $designMatches) {
            throw new IdempotencyConflictException(__('diyar.try_in_room.idempotency_conflict'));
        }
    }

    private function expireIfNeeded(TryInRoomJob $job): TryInRoomJob
    {
        if ($job->expires_at === null) {
            return $job;
        }

        if (! $job->expires_at->isPast()) {
            return $job;
        }

        if (
            $job->status === TryInRoomJobStatus::Queued
            || $job->status === TryInRoomJobStatus::Processing
        ) {
            return $this->markFailed($job, 'expired');
        }

        return $job;
    }

    public function isExpired(TryInRoomJob $job): bool
    {
        return $job->expires_at instanceof Carbon && $job->expires_at->isPast();
    }
}
