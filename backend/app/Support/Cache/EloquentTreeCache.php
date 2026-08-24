<?php

namespace App\Support\Cache;

use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * Redis-safe cache for nested Eloquent trees under Octane/Swoole.
 *
 * Never store live Eloquent models in Redis — PHP unserialize yields
 * __PHP_Incomplete_Class across workers. Persist JSON-encoded arrays instead.
 */
final class EloquentTreeCache
{
    private const META_KEY = '_diyar_eloquent_tree';

    private const VERSION = 1;

    public static function payloadMetaKey(): string
    {
        return self::META_KEY;
    }

    /**
     * @param  callable(): EloquentCollection<int, Model>  $resolver
     * @param  class-string<Model>  $modelClass
     * @param  list<string>  $nestedRelationNames
     * @return EloquentCollection<int, Model>
     */
    public static function remember(
        string $key,
        int $ttl,
        callable $resolver,
        string $modelClass,
        array $nestedRelationNames = [],
    ): EloquentCollection {
        if ($ttl <= 0) {
            return $resolver();
        }

        $payload = self::readPayload($key, $modelClass);

        if ($payload !== null) {
            return self::decodeCollection($payload, $modelClass, $nestedRelationNames);
        }

        /** @var EloquentCollection<int, Model> $collection */
        $collection = $resolver();

        self::writePayload(
            $key,
            self::encodeCollection($collection, $modelClass, $nestedRelationNames),
            $ttl,
        );

        return $collection;
    }

    /**
     * @param  class-string<Model>  $modelClass
     * @return array<string, mixed>|null
     */
    private static function readPayload(string $key, string $modelClass): ?array
    {
        $cached = Cache::get($key);

        if ($cached === null) {
            return null;
        }

        if (LegacyRedisCachePurger::isCorruptPayload($cached)) {
            Cache::forget($key);

            return null;
        }

        $payload = self::normalizePayload($cached);

        if ($payload === null || ! self::isValidPayload($payload, $modelClass)) {
            Cache::forget($key);

            return null;
        }

        return $payload;
    }

    /**
     * @return array<string, mixed>|null
     */
    private static function normalizePayload(mixed $cached): ?array
    {
        if (is_array($cached)) {
            return $cached;
        }

        if (! is_string($cached)) {
            return null;
        }

        try {
            $decoded = json_decode($cached, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }

        return is_array($decoded) ? $decoded : null;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private static function writePayload(string $key, array $payload, int $ttl): void
    {
        Cache::put($key, json_encode($payload, JSON_THROW_ON_ERROR), $ttl);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  class-string<Model>  $modelClass
     */
    private static function isValidPayload(array $payload, string $modelClass): bool
    {
        $meta = $payload[self::META_KEY] ?? null;

        if (! is_array($meta)) {
            return false;
        }

        return ($meta['v'] ?? null) === self::VERSION
            && ($meta['model'] ?? null) === $modelClass
            && is_array($meta['items'] ?? null);
    }

    /**
     * @param  EloquentCollection<int, Model>  $collection
     * @param  class-string<Model>  $modelClass
     * @param  list<string>  $nestedRelationNames
     * @return array<string, mixed>
     */
    private static function encodeCollection(
        EloquentCollection $collection,
        string $modelClass,
        array $nestedRelationNames,
    ): array {
        return [
            self::META_KEY => [
                'v' => self::VERSION,
                'model' => $modelClass,
                'items' => $collection
                    ->map(fn (Model $model): array => self::encodeModel($model, $nestedRelationNames))
                    ->values()
                    ->all(),
            ],
        ];
    }

    /**
     * @param  list<string>  $nestedRelationNames
     * @return array{attributes: array<string, mixed>, relations: array<string, list<array<string, mixed>>>}
     */
    private static function encodeModel(Model $model, array $nestedRelationNames): array
    {
        $relations = [];

        foreach ($nestedRelationNames as $relationName) {
            if (! $model->relationLoaded($relationName)) {
                continue;
            }

            $related = $model->getRelation($relationName);

            if ($related instanceof EloquentCollection) {
                $relations[$relationName] = $related
                    ->map(fn (Model $child): array => self::encodeModel($child, $nestedRelationNames))
                    ->values()
                    ->all();
            }
        }

        return [
            'attributes' => $model->getAttributes(),
            'relations' => $relations,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  class-string<Model>  $modelClass
     * @param  list<string>  $nestedRelationNames
     * @return EloquentCollection<int, Model>
     */
    private static function decodeCollection(
        array $payload,
        string $modelClass,
        array $nestedRelationNames,
    ): EloquentCollection {
        /** @var list<array<string, mixed>> $items */
        $items = $payload[self::META_KEY]['items'];

        $models = Collection::make($items)
            ->map(fn (array $row): Model => self::decodeModel($row, $modelClass, $nestedRelationNames))
            ->all();

        return new EloquentCollection($models);
    }

    /**
     * @param  array{attributes: array<string, mixed>, relations: array<string, list<array<string, mixed>>>}  $payload
     * @param  class-string<Model>  $modelClass
     * @param  list<string>  $nestedRelationNames
     */
    private static function decodeModel(
        array $payload,
        string $modelClass,
        array $nestedRelationNames,
    ): Model {
        /** @var Model $model */
        $model = new $modelClass;
        $model->forceFill($payload['attributes']);
        $model->exists = true;
        $model->syncOriginal();

        foreach ($nestedRelationNames as $relationName) {
            $relatedRows = $payload['relations'][$relationName] ?? null;

            if (! is_array($relatedRows)) {
                continue;
            }

            $children = Collection::make($relatedRows)
                ->map(fn (array $row): Model => self::decodeModel($row, $modelClass, $nestedRelationNames))
                ->all();

            $model->setRelation($relationName, new EloquentCollection($children));
        }

        return $model;
    }
}
