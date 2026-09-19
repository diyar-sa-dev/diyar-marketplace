<?php

namespace App\Services\Visualization\Providers;

use App\Contracts\Visualization\VisualizationProviderInterface;
use App\Exceptions\Visualization\VisualizationProviderException;
use App\Models\TryInRoomJob;
use App\Services\Visualization\VisualizationCapability;

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
