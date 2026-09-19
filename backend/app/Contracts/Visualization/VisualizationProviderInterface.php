<?php

namespace App\Contracts\Visualization;

use App\Models\TryInRoomJob;
use App\Services\Visualization\VisualizationCapability;

interface VisualizationProviderInterface
{
    public function key(): string;

    public function supports(VisualizationCapability $capability): bool;

    /**
     * @return array<string, mixed> Provider result metadata (no raw image bytes).
     *
     * @throws \App\Exceptions\Visualization\VisualizationProviderException
     */
    public function process(TryInRoomJob $job): array;
}
