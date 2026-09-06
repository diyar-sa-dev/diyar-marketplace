<?php

namespace App\Support\Cache;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;
use Illuminate\Support\Facades\Cache;

/**
 * Cache query results as plain arrays to avoid Eloquent serialization failures
 * (array/redis drivers serialize values and cannot reliably restore models).
 */
final class CachesQueryResults
{
    /**
     * @template TModel of Model
     *
     * @param  callable(): EloquentCollection<int, TModel>  $callback
     * @param  class-string<TModel>  $modelClass
     * @return EloquentCollection<int, TModel>
     */
    public static function rememberCollection(
        string $key,
        \DateTimeInterface $ttl,
        callable $callback,
        string $modelClass,
    ): EloquentCollection {
        /** @var list<array<string, mixed>> $rows */
        $rows = self::rememberRows($key, $ttl, function () use ($callback) {
            return $callback()
                ->map(static fn (Model $model) => $model->getAttributes())
                ->values()
                ->all();
        });

        /** @var EloquentCollection<int, TModel> $collection */
        $collection = $modelClass::hydrate($rows);

        return $collection;
    }

    /**
     * @template TModel of Model
     *
     * @param  callable(): LengthAwarePaginator  $callback
     * @param  class-string<TModel>  $modelClass
     * @param  list<string>|null  $relations
     */
    public static function rememberPaginator(
        string $key,
        \DateTimeInterface $ttl,
        callable $callback,
        string $modelClass,
        ?array $relations = null,
    ): LengthAwarePaginator {
        /** @var array{items: list<array<string, mixed>>, total: int, per_page: int, current_page: int} $payload */
        $payload = self::rememberRows($key, $ttl, function () use ($callback) {
            $paginator = $callback();

            return [
                'items' => $paginator->getCollection()
                    ->map(static fn (Model $model) => $model->getAttributes())
                    ->values()
                    ->all(),
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
            ];
        });

        /** @var EloquentCollection<int, TModel> $items */
        $items = $modelClass::hydrate($payload['items']);

        if ($relations !== null && $relations !== []) {
            $items->load($relations);
        }

        return new Paginator(
            $items,
            $payload['total'],
            $payload['per_page'],
            $payload['current_page'],
            [
                'path' => request()->url(),
                'pageName' => 'page',
            ],
        );
    }

    /**
     * @template TModel of Model
     *
     * @param  callable(): (?TModel)  $callback
     * @param  class-string<TModel>  $modelClass
     * @param  list<string>|null  $relations
     * @return (?TModel)
     */
    public static function rememberModel(
        string $key,
        \DateTimeInterface $ttl,
        callable $callback,
        string $modelClass,
        ?array $relations = null,
    ): ?Model {
        /** @var array<string, mixed>|null $row */
        $row = self::rememberRows($key, $ttl, function () use ($callback) {
            $model = $callback();

            return $model?->getAttributes();
        });

        if ($row === null) {
            return null;
        }

        /** @var TModel|null $model */
        $model = $modelClass::hydrate([$row])->first();

        if ($model !== null && $relations !== null && $relations !== []) {
            $model->load($relations);
        }

        return $model;
    }

    /**
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    private static function rememberRows(string $key, \DateTimeInterface $ttl, callable $callback): mixed
    {
        $cached = Cache::get($key);

        if ($cached !== null && ! is_string($cached)) {
            Cache::forget($key);
            $cached = null;
        }

        if (is_string($cached)) {
            $decoded = json_decode($cached, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                return $decoded;
            }

            Cache::forget($key);
        }

        $value = $callback();
        Cache::put($key, json_encode($value, JSON_THROW_ON_ERROR), $ttl);

        return $value;
    }
}
