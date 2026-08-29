<?php

namespace Tests\Unit\Support\Pagination;

use App\Support\Pagination\PaginationBounds;
use Tests\TestCase;

class PaginationBoundsTest extends TestCase
{
    public function test_page_is_clamped_to_configured_maximum(): void
    {
        config(['diyar.catalog.pagination.max_page' => 200]);

        $this->assertSame(1, PaginationBounds::page(0));
        $this->assertSame(50, PaginationBounds::page(50));
        $this->assertSame(200, PaginationBounds::page(999));
    }

    public function test_per_page_is_clamped_to_configured_maximum(): void
    {
        config(['diyar.catalog.pagination.max_per_page' => 50]);

        $this->assertSame(1, PaginationBounds::perPage(0));
        $this->assertSame(24, PaginationBounds::perPage(24));
        $this->assertSame(50, PaginationBounds::perPage(500));
    }
}
