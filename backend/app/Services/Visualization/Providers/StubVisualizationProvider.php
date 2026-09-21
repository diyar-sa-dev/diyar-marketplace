<?php

namespace App\Services\Visualization\Providers;

use App\Contracts\Visualization\VisualizationProviderInterface;
use App\Exceptions\Visualization\VisualizationProviderException;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\RoomDesign;
use App\Models\TryInRoomJob;
use App\Services\Visualization\Support\StubTryInRoomCompositor;
use App\Services\Visualization\Support\TryInRoomPrivateImageReader;
use App\Services\Visualization\Support\TryInRoomResultImageStore;
use App\Services\Visualization\VisualizationCapability;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

final class StubVisualizationProvider implements VisualizationProviderInterface
{
    public function __construct(
        private readonly TryInRoomPrivateImageReader $imageReader,
        private readonly TryInRoomResultImageStore $resultStore,
        private readonly StubTryInRoomCompositor $compositor,
    ) {}

    public function key(): string
    {
        return 'stub';
    }

    public function supports(VisualizationCapability $capability): bool
    {
        return $capability === VisualizationCapability::TryInRoomComposite;
    }

    public function process(TryInRoomJob $job): array
    {
        if (config('diyar.try_in_room.stub_force_failure', false)) {
            throw new VisualizationProviderException('processing_failed', 'stub_failure');
        }

        try {
            $roomBytes = $this->roomBytes($job);
            $productBytes = $this->productImageBytes($job->product_id, $job->room_design_id);
            $png = $this->compositor->compose($roomBytes, $productBytes);
            $resultPath = $this->resultStore->storePngForJob($job, $png);
        } catch (InvalidArgumentException) {
            throw new VisualizationProviderException('result_storage_failed');
        } catch (\Throwable) {
            throw new VisualizationProviderException('processing_failed');
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

    private function roomBytes(TryInRoomJob $job): string
    {
        try {
            return $this->imageReader->readSourceForJob($job)['bytes'];
        } catch (InvalidArgumentException) {
            return $this->compositor->blankRoomPng();
        }
    }

    private function productImageBytes(mixed $productId, mixed $roomDesignId = null): ?string
    {
        try {
            $resolvedProductId = is_string($productId) && $productId !== ''
                ? $productId
                : $this->firstDesignProductId($roomDesignId);

            if (! is_string($resolvedProductId) || $resolvedProductId === '') {
                return null;
            }

            $image = ProductImage::query()
                ->with('mediaFile')
                ->where('product_id', $resolvedProductId)
                ->orderBy('sort_order')
                ->first();

            $path = $image?->mediaFile?->path;
            if (! is_string($path) || $path === '') {
                $product = Product::query()->with('images.mediaFile')->whereKey($resolvedProductId)->first();
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

    private function firstDesignProductId(mixed $roomDesignId): ?string
    {
        if (! is_string($roomDesignId) || $roomDesignId === '') {
            return null;
        }

        try {
            $design = RoomDesign::query()->find($roomDesignId);
        } catch (\Throwable) {
            return null;
        }

        $items = is_array($design?->document) ? ($design->document['items'] ?? null) : null;
        if (! is_array($items)) {
            return null;
        }

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }
            $id = $item['product_id'] ?? null;
            if (is_string($id) && $id !== '') {
                return $id;
            }
        }

        return null;
    }
}
