<?php

namespace App\Domains\Search\Services;

use App\Domains\Search\Contracts\SearchEngineInterface;
use App\Models\User;

/** Default search engine — delegates to existing CatalogSearchService (SQL LIKE). */
final class MysqlCatalogSearchEngine implements SearchEngineInterface
{
    public function __construct(
        private readonly CatalogSearchService $catalogSearch,
    ) {}

    public function search(array $filters, ?string $userId = null): array
    {
        $user = $userId !== null ? User::query()->find($userId) : null;

        return $this->catalogSearch->search($filters, $user);
    }

    public function upsert(string $entityType, string $entityId, array $document): void
    {
        // Phase 1: no external index — DB is authoritative.
    }

    public function delete(string $entityType, string $entityId): void
    {
        // Phase 1: no external index.
    }

    public function health(): array
    {
        return [
            'engine' => 'mysql',
            'status' => 'HEALTHY',
        ];
    }
}
