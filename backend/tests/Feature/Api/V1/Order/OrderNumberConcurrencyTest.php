<?php

namespace Tests\Feature\Api\V1\Order;

use App\Services\Order\OrderNumberService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderNumberConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_numbers_are_unique_under_sequential_allocation(): void
    {
        $service = app(OrderNumberService::class);
        $numbers = [];

        for ($i = 0; $i < 5; $i++) {
            $numbers[] = $service->allocate();
        }

        $this->assertCount(5, array_unique($numbers));
        $this->assertMatchesRegularExpression('/^DYR-\d{8}-\d{6}$/', $numbers[0]);
    }

    /**
     * Sequential allocation validates format and monotonic uniqueness in-process only.
     * True multi-process concurrency is covered by OrderNumberParallelAllocationTest.
     */
}
