<?php

namespace App\Services\Visualization\Providers\OpenAi;

use App\Exceptions\Visualization\VisualizationProviderException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

final class OpenAiVisualizationHttpClient
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function createRoomComposite(string $roomPngBytes, string $prompt): array
    {
        $apiKey = (string) config('diyar.visualization.openai.api_key', '');
        if ($apiKey === '') {
            throw new VisualizationProviderException('provider_configuration_invalid');
        }

        $baseUrl = rtrim((string) config('diyar.visualization.openai.base_url', 'https://api.openai.com/v1'), '/');
        $model = (string) config('diyar.visualization.openai.image_model', 'gpt-image-1');
        $connectTimeout = max(1, (int) config('diyar.visualization.openai.connect_timeout_seconds', 10));
        $requestTimeout = max(1, (int) config('diyar.visualization.openai.request_timeout_seconds', 90));

        $tmp = tempnam(sys_get_temp_dir(), 'diyar-room-');
        if ($tmp === false) {
            throw new VisualizationProviderException('processing_failed');
        }

        $tmpPath = $tmp.'.png';
        @unlink($tmp);
        if (file_put_contents($tmpPath, $roomPngBytes) === false) {
            throw new VisualizationProviderException('processing_failed');
        }

        try {
            $response = Http::withToken($apiKey)
                ->connectTimeout($connectTimeout)
                ->timeout($requestTimeout)
                ->acceptJson()
                ->attach('image[]', fopen($tmpPath, 'r'), 'room.png')
                ->post($baseUrl.'/images/edits', [
                    'model' => $model,
                    'prompt' => $prompt,
                    'response_format' => 'b64_json',
                    'n' => 1,
                    'size' => (string) config('diyar.visualization.openai.size', '1024x1024'),
                ]);
        } catch (ConnectionException) {
            throw new VisualizationProviderException('provider_network_failure');
        } finally {
            @unlink($tmpPath);
        }

        if ($response->status() === 429) {
            throw new VisualizationProviderException('provider_rate_limited');
        }

        if ($response->status() === 401 || $response->status() === 403) {
            Log::info('visualization.openai_auth_failed', ['status' => $response->status()]);

            throw new VisualizationProviderException('provider_configuration_invalid');
        }

        if ($response->failed()) {
            throw new VisualizationProviderException('provider_rejected');
        }

        $data = $response->json('data');
        if (! is_array($data)) {
            throw new VisualizationProviderException('provider_malformed_response');
        }

        return $data;
    }
}
