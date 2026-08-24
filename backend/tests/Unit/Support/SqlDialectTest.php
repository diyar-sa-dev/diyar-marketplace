<?php

namespace Tests\Unit\Support;

use App\Support\Database\SqlDialect;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SqlDialectTest extends TestCase
{
    public function test_pgsql_coalesce_string_with_time_column_casts_time_operand(): void
    {
        Config::set('database.default', 'pgsql');
        DB::shouldReceive('connection')->andReturnSelf();
        DB::shouldReceive('getDriverName')->andReturn('pgsql');

        $sql = SqlDialect::coalesceStringWithTimeColumn('proposed_scheduled_time', 'scheduled_time');

        $this->assertStringContainsString('proposed_scheduled_time::text', $sql);
        $this->assertStringContainsString("TO_CHAR(scheduled_time, 'HH24:MI:SS')", $sql);
    }

    public function test_mysql_coalesce_string_with_time_column_uses_native_time(): void
    {
        Config::set('database.default', 'mysql');
        DB::shouldReceive('connection')->andReturnSelf();
        DB::shouldReceive('getDriverName')->andReturn('mysql');

        $sql = SqlDialect::coalesceStringWithTimeColumn('proposed_scheduled_time', 'scheduled_time');

        $this->assertSame('COALESCE(proposed_scheduled_time, scheduled_time)', $sql);
    }
}
