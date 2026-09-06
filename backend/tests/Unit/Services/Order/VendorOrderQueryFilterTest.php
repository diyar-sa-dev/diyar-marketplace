<?php

namespace Tests\Unit\Services\Order;

use App\Models\VendorOrder;
use App\Services\Order\VendorOrderQueryFilter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendorOrderQueryFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_apply_status_filter_processing_includes_accepted(): void
    {
        $filter = new VendorOrderQueryFilter;
        $query = VendorOrder::query();

        $filter->applyStatusFilter($query, 'processing');

        $this->assertSame(['processing', 'accepted'], $query->getBindings());
    }

    public function test_search_resolves_arabic_accepted_keyword(): void
    {
        $filter = new VendorOrderQueryFilter;
        $query = VendorOrder::query();

        $filter->applySearchFilter($query, 'مقبول');

        $sql = strtolower($query->toSql());
        $this->assertTrue(
            str_contains($sql, '`status` in') || str_contains($sql, '"status" in'),
            $query->toSql(),
        );
        $this->assertContains('accepted', $query->getBindings());
    }
}
