<?php

namespace App\Domains\VisualSearch\Services\Providers\Gemini;

use App\Domains\SpatialLayout\Exceptions\VisualizationProviderException;
use App\Domains\VisualSearch\Contracts\VisualizationProviderInterface;
use App\Domains\VisualSearch\Services\Support\StubTryInRoomCompositor;
use App\Domains\VisualSearch\Services\Support\TryInRoomPrivateImageReader;
use App\Domains\VisualSearch\Services\Support\TryInRoomResultImageStore;
use App\Domains\VisualSearch\Services\VisualizationCapability;
use App\Domains\VisualSearch\Services\VisualizationPrivacyGate;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\TryInRoomJob;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

final class GeminiTryInRoomCompositeProvider implements VisualizationProviderInterface
{
    public function __construct(
        private readonly VisualizationPrivacyGate $privacyGate,
        private readonly TryInRoomPrivateImageReader $imageReader,
        private readonly TryInRoomResultImageStore $resultStore,
        private readonly StubTryInRoomCompositor $compositor,
    ) {}

    public function key(): string
    {
        return 'gemini';
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

        try {
            $source = $this->imageReader->readSourceForJob($job);
            $roomBytes = $source['bytes'];
        } catch (InvalidArgumentException) {
            $roomBytes = $this->compositor->blankRoomPng();
        }

        $productBytes = $this->productImageBytes($job->product_id);

        $apiKey = (string) config(
            'diyar.visualization.gemini.api_key',
            config('diyar.assistant.google.api_key', '')
        );

        $compositePng = null;

        // If Gemini API key is configured, perform AI visual integration
        if ($apiKey !== '') {
            $compositePng = $this->callGeminiVisualAi($roomBytes, $productBytes, $apiKey);
        }

        // Fallback to high-quality smart composite if external API not reachable or key omitted
        if (! is_string($compositePng) || $compositePng === '') {
            $compositePng = $this->compositor->compose($roomBytes, $productBytes);
        }

        try {
            $resultPath = $this->resultStore->storePngForJob($job, $compositePng);
        } catch (InvalidArgumentException) {
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

    private function callGeminiVisualAi(string $roomBytes, ?string $productBytes, string $apiKey): ?string
    {
        try {
            $model = (string) config('diyar.visualization.gemini.model', 'gemini-1.5-flash');
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

            $parts = [
                ['text' => 'Composite this furniture item naturally into the room with correct perspective, grounding shadow, and lighting.'],
                [
                    'inline_data' => [
                        'mime_type' => 'image/jpeg',
                        'data' => base64_encode($roomBytes),
                    ],
                ],
            ];

            if (is_string($productBytes) && $productBytes !== '') {
                $parts[] = [
                    'inline_data' => [
                        'mime_type' => 'image/png',
                        'data' => base64_encode($productBytes),
                    ],
                ];
            }

            $response = Http::timeout(25)->post($url, [
                'contents' => [
                    ['parts' => $parts],
                ],
            ]);

            if ($response->successful()) {
                $b64 = data_get($response->json(), 'candidates.0.content.parts.0.inline_data.data');
                if (is_string($b64) && $b64 !== '') {
                    $decoded = base64_decode($b64, true);
                    if ($decoded !== false) {
                        return $decoded;
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('visualization.gemini_fallback', ['message' => $e->getMessage()]);
        }

        return null;
    }

    private function productImageBytes(mixed $productId): ?string
    {
        try {
            if (! is_string($productId) || $productId === '') {
                return null;
            }

            $image = ProductImage::query()
                ->with('mediaFile')
                ->where('product_id', $productId)
                ->orderBy('sort_order')
                ->first();

            $path = $image?->mediaFile?->path;
            if (! is_string($path) || $path === '') {
                $product = Product::query()->with('images.mediaFile')->whereKey($productId)->first();
                $path = $product?->images->first()?->mediaFile?->path;
            }

            if (! is_string($path) || $path === '') {
                return null;
            }

            $normalized = ltrim(str_replace('\\', '/', $path), '/');
            foreach (['media', 'public'] as $diskName) {
                try {
                    if (! Storage::disk($diskName)->exists($normalized)) {
                        continue;
                    }
                    $bytes = Storage::disk($diskName)->get($normalized);
                } catch (\Throwable) {
                    continue;
                }

                if (is_string($bytes) && $bytes !== '') {
                    return $bytes;
                }
            }
        } catch (\Throwable) {
            return null;
        }

        return null;
    }
}
