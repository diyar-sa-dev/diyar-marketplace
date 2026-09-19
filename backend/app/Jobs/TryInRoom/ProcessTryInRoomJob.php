<?php

namespace App\Jobs\TryInRoom;

use App\Enums\TryInRoomJobStatus;
use App\Services\TryInRoom\TryInRoomJobService;
use App\Services\TryInRoom\TryInRoomStorageService;
use App\Services\Visualization\VisualizationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

final class ProcessTryInRoomJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(
        public readonly string $tryInRoomJobId,
    ) {}

    public function handle(
        TryInRoomJobService $jobs,
        TryInRoomStorageService $storage,
        VisualizationService $visualization,
    ): void {
        $job = $jobs->findForProcessing($this->tryInRoomJobId);
        if ($job === null) {
            return;
        }

        if ($job->status === TryInRoomJobStatus::Completed || $job->status === TryInRoomJobStatus::Failed) {
            return;
        }

        $job->loadMissing('sourceImage');
        $source = $job->sourceImage;
        if ($source === null || ! $storage->sourceObjectExists($source)) {
            $jobs->markFailed($job, 'source_missing');

            return;
        }

        if (! $jobs->claimForProcessing($job)) {
            return;
        }

        try {
            $fresh = $job->fresh();
            if ($fresh === null || $fresh->status !== TryInRoomJobStatus::Processing) {
                return;
            }

            $outcome = $visualization->execute($fresh);
            if (! $outcome->success) {
                $jobs->markFailed($fresh, $outcome->failureCode ?? 'processing_failed');

                return;
            }

            $jobs->markCompleted($fresh, $outcome->payload, $outcome->providerKey);
        } catch (Throwable $exception) {
            Log::info('try_in_room.job_failed', [
                'job_id' => $job->id,
                'user_id' => $job->user_id,
                'error' => $exception->getMessage(),
            ]);

            $latest = $job->fresh();
            if ($latest !== null && $latest->status !== TryInRoomJobStatus::Failed) {
                $jobs->markFailed($latest, 'processing_failed');
            }
        }
    }
}
