<?php

namespace App\Services\SpatialLayout;

use App\Contracts\SpatialLayout\SpatialLayoutProviderInterface;
use App\Services\SpatialLayout\Providers\NullSpatialLayoutProvider;
use App\Services\SpatialLayout\Providers\StubSpatialLayoutProvider;
use Illuminate\Contracts\Container\Container;
use InvalidArgumentException;

class SpatialLayoutProviderRegistry
{
    /** @var array<string, class-string<SpatialLayoutProviderInterface>> */
    private const MAP = [
        'null' => NullSpatialLayoutProvider::class,
        'stub' => StubSpatialLayoutProvider::class,
    ];

    public function __construct(
        private readonly Container $container,
    ) {}

    public function resolve(?string $driver = null): SpatialLayoutProviderInterface
    {
        $name = strtolower(trim($driver ?? (string) config('diyar.spatial_layout.driver', 'stub')));
        if ($name === '') {
            $name = 'stub';
        }

        if ($name === 'openai' || $name === 'external') {
            throw new InvalidArgumentException('spatial_layout_external_blocked');
        }

        $class = self::MAP[$name] ?? null;
        if ($class === null) {
            throw new InvalidArgumentException('unknown_spatial_layout_driver');
        }

        return $this->container->make($class);
    }
}
