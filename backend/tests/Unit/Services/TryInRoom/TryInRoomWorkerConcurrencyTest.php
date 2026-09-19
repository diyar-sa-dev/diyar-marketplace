<?php

namespace Tests\Unit\Services\TryInRoom;

use App\Enums\TryInRoomJobStatus;
use App\Jobs\TryInRoom\ProcessTryInRoomJob;
use App\Models\TryInRoomJob;
use App\Models\TryInRoomSourceImage;
use App\Models\User;
use App\Services\TryInRoom\TryInRoomJobService;
use App\Services\TryInRoom\TryInRoomStorageService;
use App\Services\Visualization\VisualizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\ConfiguresTryInRoomVisualization;
use Tests\TestCase;

class TryInRoomWorkerConcurrencyTest extends TestCase
{
    use ConfiguresTryInRoomVisualization, RefreshDatabase;

    #[Test]
    public function duplicate_worker_invocation_runs_visualization_once(): void
    {
        Storage::fake('try_in_room');
        $this->enableStubVisualization();

        $user = User::factory()->create();
        $source = TryInRoomSourceImage::query()->create([
            'user_id' => $user->id,
            'disk' => 'try_in_room',
            'path' => "{$user->id}/sample.png",
            'mime' => 'image/png',
            'width_px' => 8,
            'height_px' => 8,
            'size_bytes' => 64,
        ]);
        Storage::disk('try_in_room')->put($source->path, 'png-bytes');

        $job = new TryInRoomJob([
            'user_id' => $user->id,
            'source_image_id' => $source->id,
            'queued_at' => now(),
        ]);
        $job->forceFill(['status' => TryInRoomJobStatus::Queued])->save();

        $worker = new ProcessTryInRoomJob($job->id);
        $worker->handle(
            app(TryInRoomJobService::class),
            app(TryInRoomStorageService::class),
            app(VisualizationService::class),
        );
        $worker->handle(
            app(TryInRoomJobService::class),
            app(TryInRoomStorageService::class),
            app(VisualizationService::class),
        );

        $fresh = $job->fresh();
        $this->assertSame(TryInRoomJobStatus::Completed, $fresh->status);
        $this->assertSame('stub', $fresh->provider_key);
    }

    #[Test]
    public function claim_for_processing_allows_only_one_transition_from_queued(): void
    {
        $user = User::factory()->create();
        $source = TryInRoomSourceImage::query()->create([
            'user_id' => $user->id,
            'disk' => 'try_in_room',
            'path' => "{$user->id}/x.png",
            'mime' => 'image/png',
            'width_px' => 1,
            'height_px' => 1,
            'size_bytes' => 1,
        ]);

        $job = new TryInRoomJob([
            'user_id' => $user->id,
            'source_image_id' => $source->id,
        ]);
        $job->forceFill(['status' => TryInRoomJobStatus::Queued])->save();

        $service = app(TryInRoomJobService::class);
        $this->assertTrue($service->claimForProcessing($job));
        $this->assertFalse($service->claimForProcessing($job->fresh()));
    }
}
