<?php

namespace Tests\Feature\Api\V1\RoomDesign;

use App\Enums\RoleName;
use App\Models\RoomDesign;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class RoomDesignSuggestLayoutTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'diyar.feature.room_designer_enabled' => true,
            'diyar.feature.room_designer_ai_spatial_enabled' => true,
            'diyar.spatial_layout.driver' => 'stub',
        ]);
    }

    public function test_guest_cannot_suggest_layout(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $design = $this->createDesignForUser($user);

        $this->postJson("/api/v1/room-designs/{$design->id}/suggest-layout")
            ->assertUnauthorized();
    }

    public function test_sub_flag_disabled_returns_forbidden(): void
    {
        config(['diyar.feature.room_designer_ai_spatial_enabled' => false]);
        $user = $this->createUserWithRole(RoleName::Customer);
        $design = $this->createDesignForUser($user);

        $this->actingAs($user)
            ->postJson("/api/v1/room-designs/{$design->id}/suggest-layout")
            ->assertForbidden();
    }

    public function test_owner_receives_suggestions_without_mutating_design(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $itemId = (string) Str::uuid();
        $document = $this->sampleDocument([
            'items' => [
                $this->sampleItem(['id' => $itemId, 'position_m' => ['x' => 0.5, 'z' => 0.5]]),
            ],
        ]);
        $design = $this->createDesignForUser($user, ['document' => $document]);
        $before = $design->fresh()->document;

        $response = $this->actingAs($user)
            ->postJson("/api/v1/room-designs/{$design->id}/suggest-layout", ['intent' => 'arrange'])
            ->assertOk()
            ->assertJsonPath('data.layout_suggestion.provider', 'stub');

        $commands = $response->json('data.layout_suggestion.commands');
        $this->assertIsArray($commands);
        $this->assertNotEmpty($commands);

        $after = $design->fresh()->document;
        $this->assertSame($before['items'][0]['position_m'], $after['items'][0]['position_m']);
    }

    public function test_intent_over_max_returns_validation_error(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $design = $this->createDesignForUser($user);

        $this->actingAs($user)
            ->postJson("/api/v1/room-designs/{$design->id}/suggest-layout", [
                'intent' => str_repeat('x', 501),
            ])
            ->assertStatus(422);
    }

    public function test_idor_returns_forbidden(): void
    {
        $owner = $this->createUserWithRole(RoleName::Customer);
        $intruder = $this->createUserWithRole(RoleName::Customer);
        $design = $this->createDesignForUser($owner);

        $this->actingAs($intruder)
            ->postJson("/api/v1/room-designs/{$design->id}/suggest-layout")
            ->assertForbidden();
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createDesignForUser(User $user, array $overrides = []): RoomDesign
    {
        $document = $overrides['document'] ?? $this->sampleDocument();
        unset($overrides['document']);

        $design = new RoomDesign;
        $design->forceFill(array_merge([
            'user_id' => $user->id,
            'title' => null,
            'document' => $document,
            'schema_version' => 1,
            'version' => 1,
            'item_count' => count($document['items'] ?? []),
        ], $overrides))->save();

        return $design->fresh();
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function sampleDocument(array $overrides = []): array
    {
        $base = [
            'schema_version' => 1,
            'room' => [
                'width_m' => 4.5,
                'depth_m' => 4.0,
                'height_m' => 2.8,
                'origin' => 'corner',
            ],
            'items' => [],
        ];

        return array_replace_recursive($base, $overrides);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function sampleItem(array $overrides = []): array
    {
        $base = [
            'id' => (string) Str::uuid(),
            'product_id' => '550e8400-e29b-41d4-a716-446655440042',
            'position_m' => ['x' => 1.0, 'z' => 1.0],
            'rotation_deg' => 0,
            'locked' => false,
            'layer' => 0,
            'snapshot' => [
                'name' => 'Sofa',
                'width_m' => 1.2,
                'depth_m' => 0.8,
            ],
        ];

        return array_replace($base, $overrides);
    }
}
