<?php

namespace Tests\Unit\Jobs\TryInRoom;

use App\Enums\TryInRoomJobStatus;
use App\Jobs\TryInRoom\ProcessTryInRoomJob;
use App\Models\TryInRoomJob;
use App\Models\TryInRoomSourceImage;
use App\Models\User;
use App\Services\TryInRoom\TryInRoomJobService;
use App\Services\TryInRoom\TryInRoomStorageService;
use App\Services\Visualization\VisualizationResult;
use App\Services\Visualization\VisualizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProcessTryInRoomJobVisualizationTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function duplicate_handle_invokes_visualization_service_only_once(): void
    {
        Storage::fake('try_in_room');

        $user = User::factory()->create();
        $source = TryInRoomSourceImage::query()->create([
            'user_id' => $user->id,
            'disk' => 'try_in_room',
            'path' => "{$user->id}/room.png",
            'mime' => 'image/png',
            'width_px' => 4,
            'height_px' => 4,
            'size_bytes' => 16,
        ]);
        Storage::disk('try_in_room')->put($source->path, 'bytes');

        $job = new TryInRoomJob([
            'user_id' => $user->id,
            'source_image_id' => $source->id,
            'queued_at' => now(),
        ]);
        $job->forceFill(['status' => TryInRoomJobStatus::Queued])->save();

        $visualization = \Mockery::mock(VisualizationService::class);
        $visualization->shouldReceive('execute')
            ->once()
            ->andReturn(VisualizationResult::succeeded(['kind' => 'stub'], 'stub'));
        $this->app->forgetInstance(VisualizationService::class);
        $this->app->instance(VisualizationService::class, $visualization);

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

        $this->assertSame(TryInRoomJobStatus::Completed, $job->fresh()->status);
    }

    #[Test]
    public function handle_skips_visualization_when_job_already_processing(): void
    {
        Storage::fake('try_in_room');

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
        Storage::disk('try_in_room')->put($source->path, 'x');

        $job = new TryInRoomJob([
            'user_id' => $user->id,
            'source_image_id' => $source->id,
        ]);
        $job->forceFill([
            'status' => TryInRoomJobStatus::Processing,
            'started_at' => now(),
            'attempts' => 1,
        ])->save();

        $visualization = \Mockery::mock(VisualizationService::class);
        $visualization->shouldReceive('execute')->never();
        $this->app->forgetInstance(VisualizationService::class);
        $this->app->instance(VisualizationService::class, $visualization);

        (new ProcessTryInRoomJob($job->id))->handle(
            app(TryInRoomJobService::class),
            app(TryInRoomStorageService::class),
            app(VisualizationService::class),
        );
    }
}
