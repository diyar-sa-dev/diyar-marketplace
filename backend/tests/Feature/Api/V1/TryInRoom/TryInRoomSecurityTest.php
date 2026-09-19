<?php

namespace Tests\Feature\Api\V1\TryInRoom;

use App\Enums\RoleName;
use App\Jobs\TryInRoom\ProcessTryInRoomJob;
use App\Services\TryInRoom\TryInRoomJobService;
use App\Services\TryInRoom\TryInRoomStorageService;
use App\Services\Visualization\VisualizationService;
use App\Models\Product;
use App\Models\TryInRoomJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\ConfiguresTryInRoomVisualization;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class TryInRoomSecurityTest extends TestCase
{
    use ConfiguresTryInRoomVisualization, InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['diyar.feature.try_in_room_enabled' => true]);
        $this->enableStubVisualization();
        Storage::fake('try_in_room');
    }

    #[Test]
    public function idempotency_key_reused_for_different_product_returns_conflict(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Queue::fake();

        $user = $this->createUserWithRole(RoleName::Customer);
        $productA = Product::factory()->create();
        $productB = Product::factory()->create();
        $png = $this->samplePngBytes();

        $this->actingAs($user)->post("/api/v1/products/{$productA->id}/try-in-room", [
            'photo' => UploadedFile::fake()->createWithContent('room.png', $png, 'image/png'),
            'idempotency_key' => 'shared-key',
        ], ['Accept' => 'application/json'])->assertCreated();

        $this->actingAs($user)->post("/api/v1/products/{$productB->id}/try-in-room", [
            'photo' => UploadedFile::fake()->createWithContent('room.png', $png, 'image/png'),
            'idempotency_key' => 'shared-key',
        ], ['Accept' => 'application/json'])
            ->assertStatus(409)
            ->assertJsonPath('code', 'idempotency_conflict');

        $this->assertSame(1, TryInRoomJob::query()->count());
    }

    #[Test]
    public function malicious_filename_does_not_escape_user_storage_prefix(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Queue::fake();

        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $png = $this->samplePngBytes();

        $this->actingAs($user)->post("/api/v1/products/{$product->id}/try-in-room", [
            'photo' => UploadedFile::fake()->createWithContent('../../evil.png', $png, 'image/png'),
        ], ['Accept' => 'application/json'])->assertCreated();

        $job = TryInRoomJob::query()->first();
        $path = $job->sourceImage->path;
        $this->assertStringStartsWith($user->id.'/', $path);
        $this->assertStringNotContainsString('..', $path);
        Storage::disk('try_in_room')->assertExists($path);
    }

    #[Test]
    public function poll_response_does_not_expose_storage_internals(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Queue::fake();

        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $png = $this->samplePngBytes();

        $create = $this->actingAs($user)->post("/api/v1/products/{$product->id}/try-in-room", [
            'photo' => UploadedFile::fake()->createWithContent('room.png', $png, 'image/png'),
        ], ['Accept' => 'application/json'])->assertCreated();

        $jobId = $create->json('data.try_in_room_job.id');

        $response = $this->actingAs($user)->getJson("/api/v1/try-in-room/{$jobId}")->assertOk();
        $json = json_encode($response->json());
        $this->assertIsString($json);
        $this->assertStringNotContainsString('storage/app', $json);
        $this->assertStringNotContainsString('try-in-room/', $json);
    }

    #[Test]
    public function expired_queued_job_is_marked_failed_on_poll(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Queue::fake();

        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $png = $this->samplePngBytes();

        $create = $this->actingAs($user)->post("/api/v1/products/{$product->id}/try-in-room", [
            'photo' => UploadedFile::fake()->createWithContent('room.png', $png, 'image/png'),
        ], ['Accept' => 'application/json'])->assertCreated();

        $jobId = $create->json('data.try_in_room_job.id');
        TryInRoomJob::query()->whereKey($jobId)->update(['expires_at' => now()->subMinute()]);

        $this->actingAs($user)->getJson("/api/v1/try-in-room/{$jobId}")
            ->assertOk()
            ->assertJsonPath('data.try_in_room_job.status', 'failed')
            ->assertJsonPath('data.try_in_room_job.error_code', 'expired');
    }

    #[Test]
    public function worker_marks_job_failed_when_source_file_missing(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Queue::fake();

        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $png = $this->samplePngBytes();

        $create = $this->actingAs($user)->post("/api/v1/products/{$product->id}/try-in-room", [
            'photo' => UploadedFile::fake()->createWithContent('room.png', $png, 'image/png'),
        ], ['Accept' => 'application/json'])->assertCreated();

        $jobId = $create->json('data.try_in_room_job.id');
        $job = TryInRoomJob::query()->find($jobId);
        Storage::disk('try_in_room')->delete($job->sourceImage->path);

        (new ProcessTryInRoomJob($jobId))->handle(
            app(TryInRoomJobService::class),
            app(TryInRoomStorageService::class),
            app(VisualizationService::class),
        );

        $this->actingAs($user)->getJson("/api/v1/try-in-room/{$jobId}")
            ->assertOk()
            ->assertJsonPath('data.try_in_room_job.status', 'failed')
            ->assertJsonPath('data.try_in_room_job.error_code', 'source_missing');
    }

    #[Test]
    public function migration_creates_expected_schema(): void
    {
        $this->assertTrue(Schema::hasTable('try_in_room_source_images'));
        $this->assertTrue(Schema::hasTable('try_in_room_jobs'));
        $this->assertTrue(Schema::hasColumns('try_in_room_jobs', [
            'id',
            'user_id',
            'source_image_id',
            'product_id',
            'room_design_id',
            'idempotency_key',
            'status',
            'expires_at',
        ]));
    }

    private function samplePngBytes(): string
    {
        $image = imagecreatetruecolor(32, 32);
        ob_start();
        imagepng($image);
        $bytes = (string) ob_get_clean();
        imagedestroy($image);

        return $bytes;
    }
}
