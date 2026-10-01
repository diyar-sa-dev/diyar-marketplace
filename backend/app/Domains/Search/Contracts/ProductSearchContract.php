<?php

namespace App\Domains\Search\Contracts;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ProductSearchContract
{
    /**
     * Search publicly visible catalog products with normalized filters and pagination.
     *
     * @param  array<string, mixed>  $filters
     */
    public function search(array $filters = [], ?User $user = null): LengthAwarePaginator;
}
