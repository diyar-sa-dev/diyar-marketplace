<?php

namespace Tests\Unit\Services\Visualization;

use App\Enums\TryInRoomJobStatus;
use App\Models\Product;
use App\Models\TryInRoomJob;
use App\Models\TryInRoomSourceImage;
use App\Models\User;
use App\Services\Visualization\Providers\OpenAi\OpenAiTryInRoomCompositeProvider;
use App\Services\Visualization\VisualizationPrivacyGate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class OpenAiTryInRoomCompositeProviderTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function provider_blocks_before_http_when_privacy_gate_closed(): void
    {
        Http::fake();
        config([
            'diyar.visualization.legal_approval_path' => 'conception/Stages/Stage 30/RoomDesigner/AI_VISUALIZATION_LEGAL_APPROVAL.md',
            'diyar.visualization.openai.api_key' => 'must-not-be-used',
        ]);

        $job = $this->sampleJobWithSource();

        $this->expectException(\App\Exceptions\Visualization\VisualizationProviderException::class);
        $this->expectExceptionMessage('legal_privacy_gate_closed');

        app(OpenAiTryInRoomCompositeProvider::class)->process($job);

        Http::assertNothingSent();
    }

    #[Test]
    public function provider_stores_private_result_when_gate_open_and_http_succeeds(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Storage::fake('try_in_room');

        $gate = \Mockery::mock(VisualizationPrivacyGate::class);
        $gate->shouldReceive('allowsExternalImageTransfer')->andReturn(true);
        $this->app->instance(VisualizationPrivacyGate::class, $gate);

        config([
            'diyar.visualization.openai.api_key' => 'test-key',
            'diyar.visualization.openai.base_url' => 'https://api.openai.com/v1',
        ]);

        $resultPng = $this->samplePngBytes();
        Http::fake([
            'api.openai.com/v1/images/edits' => Http::response([
                'data' => [
                    ['b64_json' => base64_encode($resultPng)],
                ],
            ], 200),
        ]);

        $job = $this->sampleJobWithSource();
        $payload = app(OpenAiTryInRoomCompositeProvider::class)->process($job);

        $this->assertSame('composite_image', $payload['kind']);
        $this->assertSame('openai', $payload['provider']);
        $this->assertArrayHasKey('result_path', $payload);
        Storage::disk('try_in_room')->assertExists($payload['result_path']);
        Http::assertSentCount(1);
    }

    #[Test]
    public function provider_rejects_oversized_base64_without_storing_result(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Storage::fake('try_in_room');
        config([
            'diyar.visualization.max_result_bytes' => 64,
            'diyar.visualization.openai.api_key' => 'test-key',
        ]);

        $gate = \Mockery::mock(VisualizationPrivacyGate::class);
        $gate->shouldReceive('allowsExternalImageTransfer')->andReturn(true);
        $this->app->instance(VisualizationPrivacyGate::class, $gate);

        Http::fake(['*' => Http::response([
            'data' => [['b64_json' => base64_encode(str_repeat('a', 200))]],
        ], 200)]);

        $job = $this->sampleJobWithSource();

        $this->expectException(\App\Exceptions\Visualization\VisualizationProviderException::class);
        app(OpenAiTryInRoomCompositeProvider::class)->process($job);
    }

    private function sampleJobWithSource(): TryInRoomJob
    {
        Storage::fake('try_in_room');

        $user = User::factory()->create();
        $product = Product::factory()->create();

        $source = TryInRoomSourceImage::query()->create([
            'user_id' => $user->id,
            'disk' => 'try_in_room',
            'path' => "{$user->id}/room.png",
            'mime' => 'image/png',
            'width_px' => 1,
            'height_px' => 1,
            'size_bytes' => strlen($this->samplePngBytes()),
        ]);
        Storage::disk('try_in_room')->put($source->path, $this->samplePngBytes());

        $job = new TryInRoomJob([
            'user_id' => $user->id,
            'source_image_id' => $source->id,
            'product_id' => $product->id,
            'queued_at' => now(),
        ]);
        $job->forceFill(['status' => TryInRoomJobStatus::Processing])->save();

        return $job->fresh(['sourceImage']);
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
