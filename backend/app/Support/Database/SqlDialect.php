<?php

namespace App\Support\Database;

use Illuminate\Support\Facades\DB;

/**
 * Portable SQL fragments for MySQL (dev) and PostgreSQL (prod-temp).
 */
final class SqlDialect
{
    public static function monthPeriodExpression(string $column = 'created_at'): string
    {
        return match (DB::connection()->getDriverName()) {
            'pgsql' => "to_char({$column}, 'YYYY-MM')",
            'mysql' => "DATE_FORMAT({$column}, '%Y-%m')",
            'sqlite' => "strftime('%Y-%m', {$column})",
            default => "DATE_FORMAT({$column}, '%Y-%m')",
        };
    }

    public static function dayPeriodExpression(string $column = 'created_at'): string
    {
        return match (DB::connection()->getDriverName()) {
            'pgsql' => "({$column})::date",
            'mysql' => "DATE({$column})",
            'sqlite' => "date({$column})",
            default => "DATE({$column})",
        };
    }

    /** Cast a SQL TIME column to a string for assignment into varchar columns. */
    public static function timeColumnAsString(string $column): string
    {
        return match (DB::connection()->getDriverName()) {
            'pgsql' => "TO_CHAR({$column}, 'HH24:MI:SS')",
            'mysql' => $column,
            'sqlite' => $column,
            default => $column,
        };
    }

    public static function coalesceStringWithTimeColumn(string $stringColumn, string $timeColumn): string
    {
        return match (DB::connection()->getDriverName()) {
            'pgsql' => 'COALESCE('.$stringColumn.'::text, '.self::timeColumnAsString($timeColumn).')',
            'mysql' => 'COALESCE('.$stringColumn.', '.$timeColumn.')',
            'sqlite' => 'COALESCE('.$stringColumn.', '.$timeColumn.')',
            default => 'COALESCE('.$stringColumn.', '.self::timeColumnAsString($timeColumn).')',
        };
    }
}
