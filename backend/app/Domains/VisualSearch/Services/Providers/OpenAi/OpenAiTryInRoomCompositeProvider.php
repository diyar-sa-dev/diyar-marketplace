<?php

namespace App\Domains\VisualSearch\Services\Providers\OpenAi;

use App\Domains\VisualSearch\Contracts\VisualizationProviderInterface;
use App\Domains\SpatialLayout\Exceptions\VisualizationProviderException;
use App\Models\Product;
use App\Models\TryInRoomJob;
use App\Domains\VisualSearch\Services\Support\TryInRoomPrivateImageReader;
use App\Domains\VisualSearch\Services\Support\TryInRoomResultImageStore;
use App\Domains\VisualSearch\Services\VisualizationCapability;
use App\Domains\VisualSearch\Services\VisualizationPrivacyGate;

final class OpenAiTryInRoomCompositeProvider implements VisualizationProviderInterface
{
    public function __construct(
        private readonly VisualizationPrivacyGate $privacyGate,
        private readonly TryInRoomPrivateImageReader $imageReader,
        private readonly TryInRoomResultImageStore $resultStore,
        private readonly OpenAiVisualizationHttpClient $client,
    ) {}

    public function key(): string
    {
        return 'openai';
    }

    public function supports(VisualizationCapability $capability): bool
    {
        return $capability === VisualizationCapability::TryInRoomComposite;
    }

    public function process(TryInRoomJob $job): array
    {
        if (! $this->privacyGate->allowsExternalImageTransfer()) {
            throw new VisualizationProviderException('legal_privacy_gate_closed');
        }

        if ($job->product_id === null) {
            throw new VisualizationProviderException('missing_product_context');
        }

        $product = Product::query()->whereKey($job->product_id)->publiclyVisible()->first();
        if ($product === null) {
            throw new VisualizationProviderException('product_not_available');
        }

        try {
            $source = $this->imageReader->readSourceForJob($job);
        } catch (\InvalidArgumentException $exception) {
            throw new VisualizationProviderException($exception->getMessage() ?: 'source_missing');
        }

        $prompt = $this->buildPrompt($product);

        $data = $this->client->createRoomComposite($source['bytes'], $prompt);
        $first = $data[0] ?? null;
        if (! is_array($first)) {
            throw new VisualizationProviderException('provider_malformed_response');
        }

        $b64 = $first['b64_json'] ?? null;
        if (! is_string($b64) || $b64 === '') {
            throw new VisualizationProviderException('provider_malformed_response');
        }

        $maxDecoded = (int) config('diyar.visualization.max_result_bytes', 12 * 1024 * 1024);
        $maxEncoded = (int) ceil($maxDecoded * 4 / 3) + 4;
        if (strlen($b64) > $maxEncoded) {
            throw new VisualizationProviderException('provider_malformed_response');
        }

        $decoded = base64_decode($b64, true);
        if ($decoded === false || strlen($decoded) > $maxDecoded) {
            throw new VisualizationProviderException('provider_malformed_response');
        }

        try {
            $resultPath = $this->resultStore->storePngForJob($job, $decoded);
        } catch (\InvalidArgumentException) {
            throw new VisualizationProviderException('result_storage_failed');
        }

        return [
            'kind' => 'composite_image',
            'provider' => $this->key(),
            'processed_at' => now()->toIso8601String(),
            'product_id' => $job->product_id,
            'room_design_id' => $job->room_design_id,
            'result_disk' => (string) config('diyar.try_in_room.disk', 'try_in_room'),
            'result_path' => $resultPath,
            'result_mime' => 'image/png',
        ];
    }

    private function buildPrompt(Product $product): string
    {
        $template = (string) config(
            'diyar.visualization.openai.composite_prompt',
            'Composite the furniture product naturally into this room photo. Preserve room geometry and lighting. Do not add text or watermarks.',
        );

        $name = trim((string) $product->name);
        if ($name === '') {
            return $template;
        }

        return $template.' Product: '.$name.'.';
    }
}
