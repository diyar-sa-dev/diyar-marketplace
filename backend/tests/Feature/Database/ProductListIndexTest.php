<?php

namespace Tests\Feature\Database;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Stage 28.9 — MySQL index regression for OPT-DB-001.
 * Skipped on SQLite (no EXPLAIN index metadata parity).
 */
class ProductListIndexTest extends TestCase
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
            $this->markTestSkipped('MySQL connection unavailable for index EXPLAIN verification.');
        }
    }

    public function test_products_public_list_uses_status_created_at_index_on_mysql(): void
    {
        $rows = DB::select(
            'EXPLAIN SELECT id FROM products WHERE status = ? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 20',
            ['active']
        );

        $this->assertNotEmpty($rows);

        $first = (array) $rows[0];
        $type = strtolower((string) ($first['type'] ?? $first['select_type'] ?? ''));
        $key = (string) ($first['key'] ?? '');
        $extra = strtolower((string) ($first['Extra'] ?? $first['extra'] ?? ''));

        $this->assertContains($type, ['ref', 'range', 'index'], 'Expected index range/ref scan, got: '.$type);
        $this->assertSame('products_status_created_at_index', $key);
        $this->assertStringNotContainsString('filesort', $extra);
    }
}
