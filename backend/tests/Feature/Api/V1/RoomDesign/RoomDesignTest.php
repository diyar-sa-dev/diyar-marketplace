<?php

namespace Tests\Feature\Api\V1\RoomDesign;

use App\Enums\RoleName;
use App\Models\Product;
use App\Models\RoomDesign;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class RoomDesignTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['diyar.feature.room_designer_enabled' => true]);
    }

    public function test_feature_flag_disabled_returns_forbidden(): void
    {
        config(['diyar.feature.room_designer_enabled' => false]);
        $user = $this->createUserWithRole(RoleName::Customer);

        $this->actingAs($user)->getJson('/api/v1/room-designs')->assertForbidden();
    }

    public function test_guest_cannot_access_room_designs(): void
    {
        $this->getJson('/api/v1/room-designs')->assertUnauthorized();
    }

    public function test_user_can_create_and_read_design(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $document = $this->sampleDocument(['room' => ['preset_id' => 'salon', 'width_m' => 4.5, 'depth_m' => 4, 'origin' => 'corner']]);

        $create = $this->actingAs($user)->postJson('/api/v1/room-designs', [
            'title' => 'غرفة المعيشة',
            'document' => $document,
        ])->assertCreated()
            ->assertJsonPath('data.room_design.version', 1)
            ->assertJsonPath('data.room_design.title', 'غرفة المعيشة');

        $id = $create->json('data.room_design.id');

        $this->actingAs($user)->getJson("/api/v1/room-designs/{$id}")
            ->assertOk()
            ->assertJsonPath('data.room_design.document.room.preset_id', 'salon');
    }

    public function test_list_returns_lightweight_items_without_full_documents(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $this->createDesignForUser($user, ['title' => 'A']);

        $response = $this->actingAs($user)->getJson('/api/v1/room-designs');
        $response->assertOk();
        $first = $response->json('data.items.0');
        $this->assertArrayHasKey('id', $first);
        $this->assertArrayNotHasKey('document', $first);
    }

    public function test_idor_returns_not_found(): void
    {
        $owner = $this->createUserWithRole(RoleName::Customer);
        $intruder = $this->createUserWithRole(RoleName::Customer);
        $design = $this->createDesignForUser($owner);

        $this->actingAs($intruder)->getJson("/api/v1/room-designs/{$design->id}")->assertNotFound();
        $this->actingAs($intruder)->putJson("/api/v1/room-designs/{$design->id}", [
            'expected_version' => 1,
            'document' => $this->sampleDocument(),
        ])->assertNotFound();
        $this->actingAs($intruder)->deleteJson("/api/v1/room-designs/{$design->id}")->assertNotFound();
    }

    public function test_update_increments_version_with_expected_version(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $design = $this->createDesignForUser($user);

        $next = $this->sampleDocument(['room' => ['width_m' => 5, 'depth_m' => 4, 'origin' => 'corner']]);

        $this->actingAs($user)->putJson("/api/v1/room-designs/{$design->id}", [
            'expected_version' => 1,
            'document' => $next,
        ])->assertOk()->assertJsonPath('data.room_design.version', 2);
    }

    public function test_version_conflict_returns_409(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $design = $this->createDesignForUser($user, ['version' => 2]);

        $this->actingAs($user)->putJson("/api/v1/room-designs/{$design->id}", [
            'expected_version' => 1,
            'document' => $this->sampleDocument(),
        ])->assertStatus(409)
            ->assertJsonPath('code', 'version_conflict')
            ->assertJsonPath('server_version', 2);
    }

    public function test_stale_save_cannot_overwrite_newer_version(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $design = $this->createDesignForUser($user, [
            'document' => $this->sampleDocument(['room' => ['width_m' => 4, 'depth_m' => 4, 'origin' => 'corner']]),
        ]);

        $this->actingAs($user)->putJson("/api/v1/room-designs/{$design->id}", [
            'expected_version' => 1,
            'document' => $this->sampleDocument(['room' => ['width_m' => 6, 'depth_m' => 4, 'origin' => 'corner']]),
        ])->assertOk();

        $this->actingAs($user)->putJson("/api/v1/room-designs/{$design->id}", [
            'expected_version' => 1,
            'document' => $this->sampleDocument(['room' => ['width_m' => 3, 'depth_m' => 4, 'origin' => 'corner']]),
        ])->assertStatus(409);

        $this->assertSame(6.0, (float) $design->fresh()->document['room']['width_m']);
    }

    public function test_legacy_integer_product_id_rejected(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $document = $this->sampleDocument([
            'items' => [
                array_merge($this->sampleItem(), ['product_id' => 42]),
            ],
        ]);

        $this->actingAs($user)->postJson('/api/v1/room-designs', [
            'document' => $document,
        ])->assertUnprocessable();
    }

    public function test_malformed_document_rejected(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $bad = $this->sampleDocument(['room' => ['width_m' => -1, 'depth_m' => 4, 'origin' => 'corner']]);

        $this->actingAs($user)->postJson('/api/v1/room-designs', [
            'document' => $bad,
        ])->assertUnprocessable()
            ->assertJsonPath('code', 'validation_failed');
    }

    public function test_invalid_product_uuid_rejected(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $document = $this->sampleDocument([
            'items' => [
                $this->sampleItem(['product_id' => (string) Str::uuid()]),
            ],
        ]);

        $this->actingAs($user)->postJson('/api/v1/room-designs', [
            'document' => $document,
        ])->assertUnprocessable();
    }

    public function test_visible_product_uuid_accepted(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $document = $this->sampleDocument([
            'items' => [
                $this->sampleItem(['product_id' => $product->id]),
            ],
        ]);

        $this->actingAs($user)->postJson('/api/v1/room-designs', [
            'document' => $document,
        ])->assertCreated()
            ->assertJsonPath('data.room_design.item_count', 1);
    }

    public function test_list_and_show_query_counts_are_bounded(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $this->createDesignForUser($user);

        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->actingAs($user)->getJson('/api/v1/room-designs')->assertOk();
        $listQueries = count(DB::getQueryLog());

        DB::flushQueryLog();
        $design = RoomDesign::query()->where('user_id', $user->id)->first();
        $this->actingAs($user)->getJson("/api/v1/room-designs/{$design->id}")->assertOk();
        $showQueries = count(DB::getQueryLog());
        DB::disableQueryLog();

        $this->assertLessThanOrEqual(8, $listQueries, 'List endpoint query count');
        $this->assertLessThanOrEqual(6, $showQueries, 'Show endpoint query count');
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
