<?php

namespace App\Services\SpatialLayout\Providers;

use App\Contracts\SpatialLayout\SpatialLayoutProviderInterface;

/**
 * Deterministic layout — no external AI, no document mutation.
 */
class StubSpatialLayoutProvider implements SpatialLayoutProviderInterface
{
    private const MAX_COMMANDS = 50;

    public function suggest(array $document, ?string $intent = null): array
    {
        $room = $document['room'] ?? [];
        if (! is_array($room)) {
            return [];
        }

        $width = (float) ($room['width_m'] ?? 0);
        $depth = (float) ($room['depth_m'] ?? 0);
        if ($width <= 0 || $depth <= 0) {
            return [];
        }

        $items = $document['items'] ?? [];
        if (! is_array($items)) {
            return [];
        }

        $movable = [];
        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }
            if ($item['locked'] ?? false) {
                continue;
            }
            $id = $item['id'] ?? null;
            if (! is_string($id) || $id === '') {
                continue;
            }
            $movable[] = $id;
        }

        if ($movable === []) {
            return [];
        }

        $movable = array_slice($movable, 0, self::MAX_COMMANDS);
        $count = count($movable);
        $margin = 0.6;
        $usableW = max(0.1, $width - (2 * $margin));
        $step = $count > 1 ? $usableW / ($count - 1) : 0.0;
        $z = round($depth / 2, 3);

        $commands = [];
        foreach ($movable as $index => $itemId) {
            $x = $count > 1
                ? $margin + ($step * $index)
                : $margin + ($usableW / 2);
            $commands[] = [
                'type' => 'MOVE',
                'itemId' => $itemId,
                'position_m' => [
                    'x' => round($x, 3),
                    'z' => $z,
                ],
            ];
        }

        return $commands;
    }
}
