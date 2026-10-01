<?php

namespace App\Domains\RoomDesigner\Services\Providers;

use App\Domains\RoomDesigner\Contracts\SpatialLayoutProviderInterface;

class NullSpatialLayoutProvider implements SpatialLayoutProviderInterface
{
    public function suggest(array $document, ?string $intent = null): array
    {
        return [];
    }
}
