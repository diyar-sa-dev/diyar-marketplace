<?php

namespace App\Services\RoomDesign;

use App\Exceptions\RoomDesign\RoomDesignPayloadTooLargeException;
use App\Models\Product;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class RoomDesignValidator
{
    private const SCHEMA_VERSION = 1;

    /**
     * @param  array<string, mixed>  $document
     */
    public function validateDocument(array $document): array
    {
        $this->assertDocumentSize($document);

        $allowedRoot = ['schema_version', 'room', 'items'];
        $this->rejectUnknownKeys($document, $allowedRoot, 'document');

        $schemaVersion = $document['schema_version'] ?? null;
        if (! is_int($schemaVersion) && ! (is_string($schemaVersion) && ctype_digit($schemaVersion))) {
            throw ValidationException::withMessages([
                'document.schema_version' => [__('diyar.room_designer.validation.schema_version')],
            ]);
        }
        $schemaVersion = (int) $schemaVersion;
        $supported = config('diyar.room_designer.supported_schema_versions', [self::SCHEMA_VERSION]);
        if (! in_array($schemaVersion, $supported, true)) {
            throw ValidationException::withMessages([
                'document.schema_version' => [__('diyar.room_designer.validation.unsupported_schema')],
            ]);
        }

        if (! isset($document['room']) || ! is_array($document['room'])) {
            throw ValidationException::withMessages([
                'document.room' => [__('diyar.room_designer.validation.room_required')],
            ]);
        }

        $room = $document['room'];
        $this->validateRoom($room);

        if (! isset($document['items']) || ! is_array($document['items'])) {
            throw ValidationException::withMessages([
                'document.items' => [__('diyar.room_designer.validation.items_required')],
            ]);
        }

        $items = $document['items'];
        $maxItems = (int) config('diyar.room_designer.max_items', 100);
        if (count($items) > $maxItems) {
            throw ValidationException::withMessages([
                'document.items' => [__('diyar.room_designer.validation.item_limit', ['max' => $maxItems])],
            ]);
        }

        $seenItemIds = [];
        $productUuids = [];

        foreach ($items as $index => $item) {
            if (! is_array($item)) {
                throw ValidationException::withMessages([
                    "document.items.{$index}" => [__('diyar.room_designer.validation.item_shape')],
                ]);
            }

            $this->validateItem($item, $index, $seenItemIds, $productUuids);
        }

        $this->validateProductReferences($productUuids);

        $document['schema_version'] = $schemaVersion;

        return $document;
    }

    /**
     * @param  array<string, mixed>  $room
     */
    private function validateRoom(array $room): void
    {
        $allowed = ['preset_id', 'width_m', 'depth_m', 'height_m', 'origin', 'grid'];
        $this->rejectUnknownKeys($room, $allowed, 'document.room');

        $minEdge = (float) config('diyar.room_designer.min_room_edge_m', 1.5);
        $maxEdge = (float) config('diyar.room_designer.max_room_edge_m', 30);
        $minHeight = (float) config('diyar.room_designer.min_room_height_m', 2);
        $maxHeight = (float) config('diyar.room_designer.max_room_height_m', 6);

        foreach (['width_m', 'depth_m'] as $key) {
            $this->assertFiniteInRange($room[$key] ?? null, $key, $minEdge, $maxEdge, 'document.room');
        }

        if (array_key_exists('height_m', $room) && $room['height_m'] !== null) {
            $this->assertFiniteInRange($room['height_m'], 'height_m', $minHeight, $maxHeight, 'document.room');
        }

        if (isset($room['origin']) && ! in_array($room['origin'], ['corner', 'center'], true)) {
            throw ValidationException::withMessages([
                'document.room.origin' => [__('diyar.room_designer.validation.room_origin')],
            ]);
        }

        if (isset($room['grid']) && is_array($room['grid'])) {
            $grid = $room['grid'];
            if (isset($grid['enabled']) && ! is_bool($grid['enabled'])) {
                throw ValidationException::withMessages([
                    'document.room.grid.enabled' => [__('diyar.room_designer.validation.grid_enabled')],
                ]);
            }
            if (isset($grid['step_m'])) {
                $this->assertFinitePositive($grid['step_m'], 'document.room.grid.step_m');
            }
        }
    }

    /**
     * @param  array<string, mixed>  $item
     * @param  list<string>  $seenItemIds
     * @param  list<string>  $productUuids
     */
    private function validateItem(array $item, int $index, array &$seenItemIds, array &$productUuids): void
    {
        $prefix = "document.items.{$index}";
        $allowed = ['id', 'product_id', 'variant_key', 'position_m', 'rotation_deg', 'locked', 'layer', 'snapshot'];
        $this->rejectUnknownKeys($item, $allowed, $prefix);

        $itemId = $item['id'] ?? null;
        if (! is_string($itemId) || $itemId === '') {
            throw ValidationException::withMessages([
                "{$prefix}.id" => [__('diyar.room_designer.validation.item_id')],
            ]);
        }
        if (in_array($itemId, $seenItemIds, true)) {
            throw ValidationException::withMessages([
                "{$prefix}.id" => [__('diyar.room_designer.validation.duplicate_item_id')],
            ]);
        }
        $seenItemIds[] = $itemId;

        $productId = $item['product_id'] ?? null;
        if (is_string($productId) && Str::isUuid($productId)) {
            $productUuids[] = $productId;
        } else {
            throw ValidationException::withMessages([
                "{$prefix}.product_id" => [__('diyar.room_designer.validation.product_id')],
            ]);
        }

        if (! isset($item['position_m']) || ! is_array($item['position_m'])) {
            throw ValidationException::withMessages([
                "{$prefix}.position_m" => [__('diyar.room_designer.validation.position')],
            ]);
        }
        foreach (['x', 'z'] as $axis) {
            $this->assertFinite($item['position_m'][$axis] ?? null, "{$prefix}.position_m.{$axis}");
        }

        $this->assertFinite($item['rotation_deg'] ?? null, "{$prefix}.rotation_deg");

        if (! isset($item['snapshot']) || ! is_array($item['snapshot'])) {
            throw ValidationException::withMessages([
                "{$prefix}.snapshot" => [__('diyar.room_designer.validation.snapshot')],
            ]);
        }

        $snapshot = $item['snapshot'];
        $snapAllowed = ['name', 'width_m', 'depth_m', 'height_m', 'thumbnail_url', 'asset_ref', 'resizable'];
        $this->rejectUnknownKeys($snapshot, $snapAllowed, "{$prefix}.snapshot");

        if (! is_string($snapshot['name'] ?? null) || $snapshot['name'] === '') {
            throw ValidationException::withMessages([
                "{$prefix}.snapshot.name" => [__('diyar.room_designer.validation.snapshot_name')],
            ]);
        }

        $minItem = (float) config('diyar.room_designer.min_item_edge_m', 0.01);
        $maxItem = (float) config('diyar.room_designer.max_item_edge_m', 10);
        foreach (['width_m', 'depth_m'] as $dim) {
            $this->assertFiniteInRange($snapshot[$dim] ?? null, $dim, $minItem, $maxItem, "{$prefix}.snapshot");
        }

        if (array_key_exists('height_m', $snapshot) && $snapshot['height_m'] !== null) {
            $this->assertFinite($snapshot['height_m'], "{$prefix}.snapshot.height_m");
        }
    }

    /**
     * @param  list<string>  $productUuids
     */
    private function validateProductReferences(array $productUuids): void
    {
        if ($productUuids === []) {
            return;
        }

        $unique = array_values(array_unique($productUuids));
        $found = Product::query()
            ->publiclyVisible()
            ->whereIn('id', $unique)
            ->pluck('id')
            ->all();

        if (count($found) !== count($unique)) {
            throw ValidationException::withMessages([
                'document.items' => [__('diyar.room_designer.validation.invalid_product')],
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<string>  $allowed
     */
    private function rejectUnknownKeys(array $payload, array $allowed, string $path): void
    {
        foreach (array_keys($payload) as $key) {
            if (! in_array($key, $allowed, true)) {
                throw ValidationException::withMessages([
                    $path => [__('diyar.room_designer.validation.unknown_key', ['key' => (string) $key])],
                ]);
            }
        }
    }

    private function assertDocumentSize(array $document): void
    {
        $encoded = json_encode($document, JSON_UNESCAPED_UNICODE);
        if ($encoded === false) {
            throw ValidationException::withMessages([
                'document' => [__('diyar.room_designer.validation.invalid_json')],
            ]);
        }

        $maxBytes = (int) config('diyar.room_designer.max_document_bytes', 524288);
        if (strlen($encoded) > $maxBytes) {
            throw new RoomDesignPayloadTooLargeException;
        }
    }

    private function assertFinite(mixed $value, string $field): void
    {
        if (! is_int($value) && ! is_float($value)) {
            throw ValidationException::withMessages([
                $field => [__('diyar.room_designer.validation.non_finite')],
            ]);
        }
        if (! is_finite($value)) {
            throw ValidationException::withMessages([
                $field => [__('diyar.room_designer.validation.non_finite')],
            ]);
        }
    }

    private function assertFinitePositive(mixed $value, string $field): void
    {
        $this->assertFinite($value, $field);
        if ($value <= 0) {
            throw ValidationException::withMessages([
                $field => [__('diyar.room_designer.validation.non_positive')],
            ]);
        }
    }

    private function assertFiniteInRange(mixed $value, string $label, float $min, float $max, string $prefix): void
    {
        $field = "{$prefix}.{$label}";
        $this->assertFinite($value, $field);
        if ($value < $min || $value > $max) {
            throw ValidationException::withMessages([
                $field => [__('diyar.room_designer.validation.out_of_range', ['min' => $min, 'max' => $max])],
            ]);
        }
    }
}
