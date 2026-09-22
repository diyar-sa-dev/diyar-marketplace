# Phase 17 — CPU profiling methodology

## Scope

Local KVM2-equivalent Docker (`diyar-kvm2-test`), Octane **2 workers**, app cpuset **0–1**, k6 cpuset **2–3**.

## Code inspection (pre-change)

| Area | Finding |
|------|---------|
| Middleware | API prepend: `EnsureCleanAuthState`, correlation ID, Sanctum stateful, locale, maintenance. Per-request reflection in auth reset. |
| Product detail | Warm path: Redis body + overlay SQL; analytics `Cache::add` dedupe + queue dispatch. |
| Search | Guest `type=all` previously called `VersionedCache::version` up to **3×** (facets + products + services). |
| Redis | Not saturated in Phase 15 sampler; opportunity = fewer redundant version GETs on search-heavy mix. |
| Serialization | Detail returns pre-serialized array from Redis; no Resource on cache hit. |

## Rejected hypothesis

**`once()` for catalog version globally** — breaks cache invalidation within a single PHPUnit request lifecycle; would require Octane `FlushOnce` equivalence in all contexts. **REJECTED** before benchmark.

## Accepted optimization 01

1. **CatalogSearchService** — single version read per `search()` passed into facets/products/services cache key builders (−2 Redis GETs per guest search with `type=all`).
2. **EnsureCleanAuthState** — cache `ReflectionProperty` for session field (immutable metadata only; Octane-safe).

## Measurement

k6 summaries + `kvm2-phase2-sampler.ps1` JSONL during rps/mix profiles.

Compare against **Phase 15 frozen baseline** (not rewritten).
