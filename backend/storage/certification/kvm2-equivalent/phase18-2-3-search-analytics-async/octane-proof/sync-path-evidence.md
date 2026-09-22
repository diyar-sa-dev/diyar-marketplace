# Phase 18.2 — Synchronous analytics evidence

## Code path (pre-18.3)

`CatalogSearchController` registered `SearchAnalyticsRecorder::record()` on `app()->terminating()`.

Under Octane/Swoole, terminating callbacks still run in the **same worker turn** before the worker accepts the next request. The HTTP response may be flushed first, but **worker occupancy** continues until the INSERT completes.

## Phase 18.1 SPX (warm HTTP kernel)

| Condition | Wall time | Dominant cost |
|-----------|----------:|---------------|
| `q=sofa` | ~401 ms | `SearchQueryEvent::create` / MySQL ~367 ms |
| no `q` | ~20 ms | Redis / validation |

## Post-18.3 HTTP path

`RecordSearchQueryAnalyticsJob::dispatch()` on **`default`** queue — HTTP no longer calls `record()` synchronously.

PHPUnit: `test_catalog_search_dispatches_analytics_job_without_blocking_persistence` (Queue::fake).
