<?php

namespace App\Contracts\Visualization;

use App\Exceptions\Visualization\VisualizationProviderException;
use App\Models\TryInRoomJob;
use App\Services\Visualization\VisualizationCapability;

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
