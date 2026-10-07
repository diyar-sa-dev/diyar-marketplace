<?php

namespace App\Domains\Search\Services;

use App\Domains\Catalog\Services\ProductService;
use App\Domains\Search\Contracts\ProductSearchContract;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class ProductSearchService implements ProductSearchContract
{
    public function __construct(
        private readonly ProductService $productService,
    ) {}

    /**
     * Execute public product search across catalog filters and text queries.
     *
     * @param  array<string, mixed>  $filters
     */
    public function search(array $filters = [], ?User $user = null): LengthAwarePaginator
    {
        return $this->productService->listPublic($filters, $user);
    }
}
