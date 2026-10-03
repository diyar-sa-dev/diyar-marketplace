<?php

namespace App\Domains\VisualSearch\Contracts;

use App\Domains\SpatialLayout\Exceptions\VisualizationProviderException;
use App\Models\TryInRoomJob;
use App\Domains\VisualSearch\Services\VisualizationCapability;

interface VisualizationProviderInterface
{
    public function key(): string;

    public function supports(VisualizationCapability $capability): bool;

    /**
     * @return array<string, mixed> Provider result metadata (no raw image bytes).
     *
     * @throws VisualizationProviderException
     */
    public function process(TryInRoomJob $job): array;
}
