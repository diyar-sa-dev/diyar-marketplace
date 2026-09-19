<?php

namespace Tests\Unit\Services\TryInRoom;

use App\Jobs\TryInRoom\ProcessTryInRoomJob;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\RateLimiter;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TryInRoomInfrastructureTest extends TestCase
{
    #[Test]
    public function try_in_room_disk_is_private_without_public_url(): void
    {
        $disk = config('filesystems.disks.try_in_room');
        $this->assertIsArray($disk);
        $this->assertSame('private', $disk['visibility'] ?? null);
        $this->assertStringContainsString('private', (string) ($disk['root'] ?? ''));
        $this->assertArrayNotHasKey('url', $disk);
    }

    #[Test]
    public function rate_limiters_are_registered(): void
    {
        $this->assertNotNull(RateLimiter::limiter('try-in-room-create'));
        $this->assertNotNull(RateLimiter::limiter('try-in-room-poll'));
    }

    #[Test]
    public function after_commit_dispatch_is_not_fired_when_transaction_rolls_back(): void
    {
        Queue::fake();

        try {
            \Illuminate\Support\Facades\DB::transaction(function () {
                \Illuminate\Support\Facades\DB::afterCommit(function () {
                    ProcessTryInRoomJob::dispatch('00000000-0000-0000-0000-000000000099');
                });
                throw new \RuntimeException('rollback');
            });
        } catch (\RuntimeException) {
            // expected
        }

        Queue::assertNothingPushed();
    }
}
