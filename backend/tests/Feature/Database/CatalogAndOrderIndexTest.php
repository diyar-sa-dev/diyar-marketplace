<?php

namespace Tests\Feature\Database;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Stage 28.9 deep pass — MySQL index regression for catalog filter + order list paths.
 */
class CatalogAndOrderIndexTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.default') !== 'mysql') {
            $this->markTestSkipped('Index EXPLAIN verification requires MySQL.');
        }

        try {
            DB::connection()->getPdo();
        } catch (\Throwable) {
            $this->markTestSkipped('MySQL connection unavailable.');
        }
    }

    public function test_products_category_list_uses_category_status_created_at_index(): void
    {
        $rows = DB::select(
            'EXPLAIN SELECT id FROM products WHERE category_id = ? AND status = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 20',
            ['00000000-0000-0000-0000-000000000001', 'active']
        );

        $key = (string) (((array) $rows[0])['key'] ?? '');

        $this->assertContains($key, [
            'products_category_status_created_at_index',
            'products_category_id_status_index',
            'products_status_created_at_index',
        ]);
    }

    public function test_products_vendor_list_uses_vendor_status_created_at_index(): void
    {
        $rows = DB::select(
            'EXPLAIN SELECT id FROM products WHERE vendor_account_id = ? AND status = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 20',
            ['00000000-0000-0000-0000-000000000001', 'active']
        );

        $key = (string) (((array) $rows[0])['key'] ?? '');

        $this->assertContains($key, [
            'products_vendor_status_created_at_index',
            'products_vendor_account_id_status_index',
            'products_status_created_at_index',
        ]);
    }

    public function test_orders_user_list_uses_user_created_at_index(): void
    {
        $this->assertIndexUsed(
            'EXPLAIN SELECT id FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
            ['00000000-0000-0000-0000-000000000001'],
            'orders_user_created_at_index'
        );
    }

    public function test_orders_admin_list_uses_created_at_index(): void
    {
        $this->assertIndexUsed(
            'EXPLAIN SELECT id FROM orders ORDER BY created_at DESC LIMIT 20',
            [],
            'orders_created_at_index'
        );
    }

    public function test_orders_admin_status_filter_uses_status_created_at_index(): void
    {
        $this->assertIndexUsed(
            'EXPLAIN SELECT id FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT 20',
            ['pending'],
            'orders_status_created_at_index'
        );
    }

    /**
     * @param  list<mixed>  $bindings
     */
    private function assertIndexUsed(string $sql, array $bindings, string $expectedIndex): void
    {
        $rows = DB::select($sql, $bindings);
        $this->assertNotEmpty($rows);

        $first = (array) $rows[0];
        $key = (string) ($first['key'] ?? '');
        $extra = strtolower((string) ($first['Extra'] ?? $first['extra'] ?? ''));

        $this->assertSame($expectedIndex, $key, 'Unexpected index for: '.$sql);
        $this->assertStringNotContainsString('filesort', $extra);
    }
}
