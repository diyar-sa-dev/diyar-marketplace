<?php

namespace App\Services\SpatialLayout\Providers;

use App\Contracts\SpatialLayout\SpatialLayoutProviderInterface;

class NullSpatialLayoutProvider implements SpatialLayoutProviderInterface
{
    public function suggest(array $document, ?string $intent = null): array
    {
        return [];
    }
}
