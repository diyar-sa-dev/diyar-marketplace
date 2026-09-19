<?php

namespace Tests\Concerns;

trait ConfiguresTryInRoomVisualization
{
    protected function enableStubVisualization(): void
    {
        config([
            'diyar.visualization.driver' => 'stub',
            'diyar.feature.ai_visualization_enabled' => false,
        ]);
    }
}
