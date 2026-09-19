<?php

namespace Tests\Feature\Api\V1\TryInRoom;

use App\Enums\RoleName;
use App\Enums\TryInRoomJobStatus;
use App\Jobs\TryInRoom\ProcessTryInRoomJob;
use App\Models\Product;
use App\Models\TryInRoomJob;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\ConfiguresTryInRoomVisualization;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class TryInRoomTest extends TestCase
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
    public function feature_flag_disabled_returns_forbidden(): void
    {
        config(['diyar.feature.try_in_room_enabled' => false]);
        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $this->actingAs($user)
            ->postJson("/api/v1/products/{$product->id}/try-in-room", [])
            ->assertForbidden();
    }

    #[Test]
    public function guest_cannot_create_or_poll(): void
    {
        $product = Product::factory()->create();

        $this->postJson("/api/v1/products/{$product->id}/try-in-room", [])->assertUnauthorized();
        $this->getJson('/api/v1/try-in-room/'.fake()->uuid())->assertUnauthorized();
    }

    #[Test]
    public function user_can_upload_and_poll_until_completed(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Queue::fake();

        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $png = $this->samplePngBytes();
        $upload = UploadedFile::fake()->createWithContent('room.png', $png, 'image/png');

        $create = $this->actingAs($user)->post("/api/v1/products/{$product->id}/try-in-room", [
            'photo' => $upload,
            'idempotency_key' => 'idem-1',
        ], ['Accept' => 'application/json']);

        $create->assertCreated()
            ->assertJsonPath('data.try_in_room_job.status', 'queued')
            ->assertJsonPath('data.try_in_room_job.product_id', $product->id);

        $jobId = $create->json('data.try_in_room_job.id');
        Queue::assertPushed(ProcessTryInRoomJob::class, fn ($job) => $job->tryInRoomJobId === $jobId);

        Queue::fake(false);
        ProcessTryInRoomJob::dispatchSync($jobId);

        $this->actingAs($user)->getJson("/api/v1/try-in-room/{$jobId}")
            ->assertOk()
            ->assertJsonPath('data.try_in_room_job.status', 'completed')
            ->assertJsonPath('data.try_in_room_job.result.kind', 'stub');

        $this->assertTrue(Storage::disk('try_in_room')->exists(
            TryInRoomJob::query()->find($jobId)->sourceImage->path,
        ));
    }

    #[Test]
    public function idempotency_key_returns_same_job(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Queue::fake();

        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $png = $this->samplePngBytes();

        $payload = [
            'photo' => UploadedFile::fake()->createWithContent('a.png', $png, 'image/png'),
            'idempotency_key' => 'dup-key',
        ];

        $first = $this->actingAs($user)->post("/api/v1/products/{$product->id}/try-in-room", $payload, [
            'Accept' => 'application/json',
        ])->assertCreated();

        $second = $this->actingAs($user)->post("/api/v1/products/{$product->id}/try-in-room", [
            'photo' => UploadedFile::fake()->createWithContent('b.png', $png, 'image/png'),
            'idempotency_key' => 'dup-key',
        ], ['Accept' => 'application/json'])->assertCreated();

        $this->assertSame($first->json('data.try_in_room_job.id'), $second->json('data.try_in_room_job.id'));
        $this->assertSame(1, TryInRoomJob::query()->where('user_id', $user->id)->count());
    }

    #[Test]
    public function idor_poll_returns_not_found(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Queue::fake();

        $owner = $this->createUserWithRole(RoleName::Customer);
        $intruder = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $png = $this->samplePngBytes();

        $create = $this->actingAs($owner)->post("/api/v1/products/{$product->id}/try-in-room", [
            'photo' => UploadedFile::fake()->createWithContent('room.png', $png, 'image/png'),
        ], ['Accept' => 'application/json'])->assertCreated();

        $jobId = $create->json('data.try_in_room_job.id');

        $this->actingAs($intruder)->getJson("/api/v1/try-in-room/{$jobId}")->assertNotFound();
    }

    #[Test]
    public function rejects_invalid_image_type(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $file = UploadedFile::fake()->create('evil.pdf', 100, 'application/pdf');

        $this->actingAs($user)->post("/api/v1/products/{$product->id}/try-in-room", [
            'photo' => $file,
        ], ['Accept' => 'application/json'])
            ->assertStatus(422);
    }

    #[Test]
    public function client_cannot_set_status_via_mass_assignment(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Queue::fake();

        $user = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();
        $png = $this->samplePngBytes();

        $this->actingAs($user)->post("/api/v1/products/{$product->id}/try-in-room", [
            'photo' => UploadedFile::fake()->createWithContent('room.png', $png, 'image/png'),
            'status' => 'completed',
            'user_id' => 99999,
        ], ['Accept' => 'application/json'])->assertCreated()
            ->assertJsonPath('data.try_in_room_job.status', TryInRoomJobStatus::Queued->value);

        $job = TryInRoomJob::query()->first();
        $this->assertSame($user->id, $job->user_id);
        $this->assertSame(TryInRoomJobStatus::Queued, $job->status);
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
