<?php

namespace Tests\Unit\Services\Visualization;

use App\Enums\TryInRoomJobStatus;
use App\Models\Product;
use App\Models\TryInRoomJob;
use App\Models\TryInRoomSourceImage;
use App\Models\User;
use App\Services\Visualization\VisualizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class OpenAiLegalGateIntegrationTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function visualization_service_blocks_openai_with_pending_legal_approval_and_no_http(): void
    {
        Http::fake();
        Storage::fake('try_in_room');

        config([
            'diyar.visualization.driver' => 'openai',
            'diyar.feature.ai_visualization_enabled' => true,
            'diyar.visualization.openai.api_key' => 'test-key-should-not-be-used',
            'diyar.visualization.legal_approval_path' => 'conception/Stages/Stage 30/RoomDesigner/AI_VISUALIZATION_LEGAL_APPROVAL.md',
            'diyar.visualization.quota_per_user_per_day' => 0,
        ]);

        $user = User::factory()->create();
        $product = Product::factory()->create();
        $png = $this->samplePngBytes();
        $source = TryInRoomSourceImage::query()->create([
            'user_id' => $user->id,
            'disk' => 'try_in_room',
            'path' => "{$user->id}/room.png",
            'mime' => 'image/png',
            'width_px' => 32,
            'height_px' => 32,
            'size_bytes' => strlen($png),
        ]);
        Storage::disk('try_in_room')->put($source->path, $png);

        $job = new TryInRoomJob([
            'user_id' => $user->id,
            'source_image_id' => $source->id,
            'product_id' => $product->id,
            'queued_at' => now(),
        ]);
        $job->forceFill(['status' => TryInRoomJobStatus::Processing])->save();

        $result = app(VisualizationService::class)->execute($job);

        $this->assertFalse($result->success);
        $this->assertSame('legal_privacy_gate_closed', $result->failureCode);
        Http::assertNothingSent();
    }

    private function samplePngBytes(): string
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD required.');
        }

        $image = imagecreatetruecolor(32, 32);
        ob_start();
        imagepng($image);
        $bytes = (string) ob_get_clean();
        imagedestroy($image);

        return $bytes;
    }
}
