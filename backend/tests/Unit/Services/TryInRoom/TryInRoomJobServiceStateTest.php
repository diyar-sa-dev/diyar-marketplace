<?php

namespace Tests\Unit\Services\TryInRoom;

use App\Enums\TryInRoomJobStatus;
use App\Models\TryInRoomJob;
use App\Models\TryInRoomSourceImage;
use App\Models\User;
use App\Services\TryInRoom\TryInRoomJobService;
use App\Services\TryInRoom\TryInRoomStorageService;
use App\Services\RoomDesign\RoomDesignDocumentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TryInRoomJobServiceStateTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function claim_for_processing_returns_false_when_already_processing(): void
    {
        $user = User::factory()->create();
        $source = TryInRoomSourceImage::query()->create([
            'user_id' => $user->id,
            'disk' => 'try_in_room',
            'path' => "{$user->id}/test.png",
            'mime' => 'image/png',
            'width_px' => 10,
            'height_px' => 10,
            'size_bytes' => 100,
        ]);

        $job = new TryInRoomJob([
            'user_id' => $user->id,
            'source_image_id' => $source->id,
            'idempotency_key' => null,
            'queued_at' => now(),
        ]);
        $job->forceFill([
            'status' => TryInRoomJobStatus::Processing,
            'attempts' => 1,
            'started_at' => now(),
        ])->save();

        $service = new TryInRoomJobService(
            $this->app->make(TryInRoomStorageService::class),
            $this->app->make(RoomDesignDocumentService::class),
        );

        $this->assertFalse($service->claimForProcessing($job));
    }
}
