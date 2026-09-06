<?php

namespace Tests\Concerns;

use Illuminate\Support\Facades\DB;

trait AssertsQueryCount
{
    protected function countQueries(callable $callback): int
    {
        DB::flushQueryLog();
        DB::enableQueryLog();

        try {
            $callback();
        } finally {
            $count = count(DB::getQueryLog());
            DB::disableQueryLog();

            return $count;
        }
    }

    protected function assertQueryCountAtMost(callable $callback, int $maximum, string $message = ''): void
    {
        $count = $this->countQueries($callback);

        $this->assertLessThanOrEqual(
            $maximum,
            $count,
            $message !== '' ? $message : "Expected at most {$maximum} queries, got {$count}.",
        );
    }
}
