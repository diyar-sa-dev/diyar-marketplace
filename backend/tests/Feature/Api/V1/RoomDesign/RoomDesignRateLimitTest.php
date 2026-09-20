<?php

namespace Tests\Feature\Api\V1\RoomDesign;

use App\Enums\RoleName;
use App\Models\RoomDesign;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class RoomDesignRateLimitTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'diyar.feature.room_designer_enabled' => true,
            'diyar.feature.room_designer_ai_spatial_enabled' => true,
            'diyar.rate_limits.room_design_save_per_minute' => 5,
        ]);
        RateLimiter::clear('room-design-save');
    }

    #[Test]
    public function suggest_layout_returns_429_when_save_limit_exceeded(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $design = $this->createDesignForUser($user);
        $limit = (int) config('diyar.rate_limits.room_design_save_per_minute', 5);

        for ($i = 0; $i < $limit; $i++) {
            $this->actingAs($user)
                ->postJson("/api/v1/room-designs/{$design->id}/suggest-layout")
                ->assertOk();
        }

        $this->actingAs($user)
            ->postJson("/api/v1/room-designs/{$design->id}/suggest-layout")
            ->assertStatus(429);
    }

    private function createDesignForUser($user): RoomDesign
    {
        $document = [
            'schema_version' => 1,
            'room' => ['width_m' => 4.5, 'depth_m' => 4.0, 'height_m' => 2.8, 'origin' => 'corner'],
            'items' => [],
        ];

        $design = new RoomDesign;
        $design->forceFill([
            'user_id' => $user->id,
            'title' => null,
            'document' => $document,
            'schema_version' => 1,
            'version' => 1,
            'item_count' => 0,
        ])->save();

        return $design->fresh();
    }
}
