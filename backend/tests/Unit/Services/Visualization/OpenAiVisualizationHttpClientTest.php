<?php

namespace Tests\Unit\Services\Visualization;

use App\Exceptions\Visualization\VisualizationProviderException;
use App\Domains\VisualSearch\Services\Providers\OpenAi\OpenAiVisualizationHttpClient;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class OpenAiVisualizationHttpClientTest extends TestCase
{
    #[Test]
    public function missing_api_key_fails_before_http(): void
    {
        Http::fake();
        config(['diyar.visualization.openai.api_key' => '']);

        $this->expectException(VisualizationProviderException::class);
        $this->expectExceptionMessage('provider_configuration_invalid');

        app(OpenAiVisualizationHttpClient::class)->createRoomComposite('png', 'prompt');

        Http::assertNothingSent();
    }

    #[Test]
    public function rate_limit_maps_to_provider_rate_limited(): void
    {
        config(['diyar.visualization.openai.api_key' => 'test-key']);
        Http::fake(['*' => Http::response([], 429)]);

        $this->expectException(VisualizationProviderException::class);
        $this->expectExceptionMessage('provider_rate_limited');

        app(OpenAiVisualizationHttpClient::class)->createRoomComposite($this->tinyPng(), 'p');
    }

    #[Test]
    public function auth_failure_maps_to_configuration_invalid(): void
    {
        config(['diyar.visualization.openai.api_key' => 'bad']);
        Http::fake(['*' => Http::response([], 401)]);

        $this->expectException(VisualizationProviderException::class);
        $this->expectExceptionMessage('provider_configuration_invalid');

        app(OpenAiVisualizationHttpClient::class)->createRoomComposite($this->tinyPng(), 'p');
    }

    #[Test]
    public function malformed_json_body_fails_closed(): void
    {
        config(['diyar.visualization.openai.api_key' => 'test-key']);
        Http::fake(['*' => Http::response(['data' => 'not-array'], 200)]);

        $this->expectException(VisualizationProviderException::class);
        $this->expectExceptionMessage('provider_malformed_response');

        app(OpenAiVisualizationHttpClient::class)->createRoomComposite($this->tinyPng(), 'p');
    }

    private function tinyPng(): string
    {
        if (! extension_loaded('gd')) {
            return "\x89PNG\r\n\x1a\n";
        }

        $image = imagecreatetruecolor(2, 2);
        ob_start();
        imagepng($image);
        $bytes = (string) ob_get_clean();
        imagedestroy($image);

        return $bytes;
    }
}
