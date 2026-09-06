<?php

namespace App\Support\Pagination;

final class PaginationBounds
{
    public static function page(int $page, ?int $maxPage = null): int
    {
        $max = $maxPage ?? (int) config('diyar.catalog.pagination.max_page', 200);

        return min(max($page, 1), max($max, 1));
    }

    public static function perPage(int $perPage, ?int $maxPerPage = null): int
    {
        $max = $maxPerPage ?? (int) config('diyar.catalog.pagination.max_per_page', 50);

        return min(max($perPage, 1), max($max, 1));
    }
}
