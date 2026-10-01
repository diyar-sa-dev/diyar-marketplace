<?php

namespace App\Domains\RoomDesigner\Services;

use App\Domains\VisualSearch\Services\VisualizationPrivacyGate;
use InvalidArgumentException;

class SpatialLayoutService
{
    public function __construct(
        private readonly SpatialLayoutProviderRegistry $registry,
        private readonly VisualizationPrivacyGate $privacyGate,
    ) {}

    /**
     * @param  array<string, mixed>  $document
     * @return array{commands: array<int, array<string, mixed>>, provider: string, metadata: array<string, mixed>}
     */
    public function suggest(array $document, ?string $intent = null): array
    {
        $driver = (string) config('diyar.spatial_layout.driver', 'stub');
        if (in_array(strtolower($driver), ['openai', 'external'], true)) {
            if (! $this->privacyGate->allowsExternalImageTransfer()) {
                throw new InvalidArgumentException('spatial_layout_external_blocked');
            }
        }

        $provider = $this->registry->resolve($driver);
        $commands = $provider->suggest($document, $intent);

        return [
            'commands' => $commands,
            'provider' => strtolower($driver),
            'metadata' => [
                'intent' => $intent,
                'command_count' => count($commands),
            ],
        ];
    }
}
