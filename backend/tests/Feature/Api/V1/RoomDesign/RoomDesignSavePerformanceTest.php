<?php

namespace Tests\Feature\Api\V1\RoomDesign;

use App\Enums\RoleName;
use App\Models\Product;
use App\Models\RoomDesign;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

/**
 * PS30-3 — query budget + save-path smoke (sqlite in-memory; not production latency proof).
 */
class RoomDesignSavePerformanceTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['diyar.feature.room_designer_enabled' => true]);
    }

    #[Test]
    public function put_save_query_count_empty_document_is_bounded(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $design = $this->createDesignForUser($user);

        DB::flushQueryLog();
        DB::enableQueryLog();

        $start = hrtime(true);
        $this->actingAs($user)->putJson("/api/v1/room-designs/{$design->id}", [
            'expected_version' => 1,
            'document' => $this->sampleDocument(),
        ])->assertOk()->assertJsonPath('data.room_design.version', 2);
        $elapsedMs = (hrtime(true) - $start) / 1_000_000;

        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $this->assertLessThanOrEqual(12, count($queries), 'PUT save total query count');
        $this->assertLessThan(5000, $elapsedMs, 'PUT save wall time (local sqlite smoke)');
    }

    #[Test]
    public function put_save_product_lookup_is_batch_not_n_plus_one(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $items = [];
        for ($i = 0; $i < 25; $i++) {
            $items[] = $this->sampleItem([
                'id' => (string) Str::uuid(),
                'product_id' => $product->id,
            ]);
        }
        $design = $this->createDesignForUser($user, [
            'document' => $this->sampleDocument(['items' => $items]),
        ]);

        DB::flushQueryLog();
        DB::enableQueryLog();

        $next = $this->sampleDocument(['items' => $items]);
        $next['room']['width_m'] = 5;

        $this->actingAs($user)->putJson("/api/v1/room-designs/{$design->id}", [
            'expected_version' => 1,
            'document' => $next,
        ])->assertOk();

        $productSelects = array_filter(
            DB::getQueryLog(),
            static fn (array $row): bool => str_contains(strtolower($row['query']), 'from "products"')
                || str_contains(strtolower($row['query']), 'from products'),
        );
        DB::disableQueryLog();

        $this->assertLessThanOrEqual(2, count($productSelects), 'Product validation should batch whereIn');
    }

    #[Test]
    public function concurrent_stale_version_second_writer_gets_409(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $design = $this->createDesignForUser($user);

        $this->actingAs($user)->putJson("/api/v1/room-designs/{$design->id}", [
            'expected_version' => 1,
            'document' => $this->sampleDocument(['room' => ['width_m' => 5, 'depth_m' => 4, 'origin' => 'corner']]),
        ])->assertOk();

        $this->actingAs($user)->putJson("/api/v1/room-designs/{$design->id}", [
            'expected_version' => 1,
            'document' => $this->sampleDocument(['room' => ['width_m' => 3, 'depth_m' => 4, 'origin' => 'corner']]),
        ])->assertStatus(409);

        $this->assertSame(5.0, (float) $design->fresh()->document['room']['width_m']);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createDesignForUser($user, array $overrides = []): RoomDesign
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
