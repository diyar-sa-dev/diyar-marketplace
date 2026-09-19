<?php

namespace App\Services\Visualization\Providers;

use App\Contracts\Visualization\VisualizationProviderInterface;
use App\Exceptions\Visualization\VisualizationProviderException;
use App\Models\TryInRoomJob;
use App\Services\Visualization\VisualizationCapability;

final class StubVisualizationProvider implements VisualizationProviderInterface
{
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

        return [
            'kind' => 'stub',
            'provider' => $this->key(),
            'processed_at' => now()->toIso8601String(),
            'product_id' => $job->product_id,
            'room_design_id' => $job->room_design_id,
        ];
    }
}
