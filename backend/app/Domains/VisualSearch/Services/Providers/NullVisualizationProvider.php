<?php

namespace App\Domains\VisualSearch\Services\Providers;

use App\Domains\VisualSearch\Contracts\VisualizationProviderInterface;
use App\Domains\SpatialLayout\Exceptions\VisualizationProviderException;
use App\Models\TryInRoomJob;
use App\Domains\VisualSearch\Services\VisualizationCapability;

final class NullVisualizationProvider implements VisualizationProviderInterface
{
    public function key(): string
    {
        return 'null';
    }

    public function supports(VisualizationCapability $capability): bool
    {
        return false;
    }

    public function process(TryInRoomJob $job): array
    {
        throw new VisualizationProviderException('provider_unavailable');
    }
}
