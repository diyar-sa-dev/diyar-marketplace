<?php

namespace App\Services\Visualization;

use App\Contracts\Visualization\VisualizationProviderInterface;
use App\Services\Visualization\Providers\NullVisualizationProvider;
use App\Services\Visualization\Providers\StubVisualizationProvider;
use Illuminate\Contracts\Container\Container;
use InvalidArgumentException;

class VisualizationProviderRegistry
{
    /** @var array<string, class-string<VisualizationProviderInterface>> */
    private const MAP = [
        'null' => NullVisualizationProvider::class,
        'stub' => StubVisualizationProvider::class,
    ];

    public function __construct(
        private readonly Container $container,
    ) {}

    public function resolve(?string $driver = null): VisualizationProviderInterface
    {
        $name = strtolower(trim($driver ?? (string) config('diyar.visualization.driver', 'null')));
        if ($name === '') {
            $name = 'null';
        }

        $class = self::MAP[$name] ?? null;
        if ($class === null) {
            throw new InvalidArgumentException('unknown_visualization_driver');
        }

        return $this->container->make($class);
    }
}
