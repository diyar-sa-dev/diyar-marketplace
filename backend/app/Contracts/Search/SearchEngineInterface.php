<?php

namespace App\Contracts\Search;

/** Search engine adapter — MySQL default, Meilisearch optional behind feature flag. */
interface SearchEngineInterface
{
    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function search(array $filters, ?string $userId = null): array;

    /** @param  array<string, mixed>  $document */
    public function upsert(string $entityType, string $entityId, array $document): void;

    public function delete(string $entityType, string $entityId): void;

    public function health(): array;
}
