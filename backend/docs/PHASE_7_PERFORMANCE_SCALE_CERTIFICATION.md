# Phase 7 — Performance & Scale Certification

Phase 6 delivered enterprise **architecture** (resilience, degradation, observability hooks).
Phase 7 is **evidence collection** — no new product features until certification gates pass.

**Current verdict: CERTIFIED WITH LIMITATIONS** — do not upgrade to `CERTIFIED` until every gate below has recorded evidence.

---

## Semantic model (Phase 6.1)

Two independent axes:

| Axis | Values | Meaning |
|------|--------|---------|
| `display_mode` | `ranked`, `initialized`, `unavailable` | What the UI shows |
| `resolution_path` | `fresh_cache`, `fresh_generate`, `stale_cache`, `registry_only`, `disabled`, `unavailable` | How the response was obtained |

**Healthy paths** (not degraded):

- `fresh_cache` — served from TTL cache
- `fresh_generate` — summary + rank + optional init (init when ranking empty is normal)

**Dependency-degraded paths** (`degraded: true`):

- `stale_cache` — generation failed, stale backup used
- `registry_only` — no stale backup, 0-DB registry init
- `disabled` — feature flag off
- `unavailable` — nothing applicable

---

## Certification gates

### Gate 1 — MySQL/MariaDB EXPLAIN ANALYZE

**Script:** `backend/scripts/certification/filter-suggestions-explain-analyze.php`

```bash
cd backend
php scripts/certification/filter-suggestions-explain-analyze.php
php scripts/certification/filter-suggestions-explain-analyze.php --context=products:bedroom
```

**Requires:** `DB_CONNECTION=mysql` or MariaDB against staging/production-like data.

**Record for each aggregate query:**

- access type, key used, rows examined, Extra (filesort/temporary)
- EXPLAIN ANALYZE actual time if supported

**Pass criteria:**

- No full table scans on filtered catalog queries at 100K+ rows
- Indexes match predicate patterns (category+status, vendor+status, price)

---

### Gate 2 — Large catalog benchmark (100K → 1M+)

**Prerequisite:** Synthetic or production-like seed at target scale.

**Script:** `backend/scripts/certification/filter-suggestions-latency-benchmark.php`

```bash
php scripts/certification/filter-suggestions-latency-benchmark.php --iterations=50 --warmup=5
```

**Record separately:**

- PHP/service time (script output)
- DB time (enable slow query log or `DB::listen` aggregation)
- Cache hit vs miss
- Resolution path breakdown

**Pass criteria (engineering targets, verify on staging):**

| Path | p50 | p95 | p99 |
|------|-----|-----|-----|
| `fresh_cache` | ≤ 20ms | ≤ 50ms | ≤ 100ms |
| `fresh_generate` | ≤ 100ms | ≤ 250ms | ≤ 500ms |
| `stale_cache` | ≤ 30ms | ≤ 60ms | ≤ 120ms |
| `registry_only` | ≤ 10ms | ≤ 25ms | ≤ 50ms |

---

### Gate 3 — Concurrent traffic

**Script:** `backend/scripts/certification/filter-suggestions-stampede-concurrent.php`

```bash
php scripts/certification/filter-suggestions-stampede-concurrent.php --workers=50
php scripts/certification/filter-suggestions-stampede-concurrent.php --workers=100 --context=products:bedroom
```

**Scenarios to run:**

1. Cold cache, identical context (50 + 100 workers)
2. Cold cache, different contexts
3. Warm cache, identical context
4. Product + service simultaneous (run two scripts in parallel)
5. Redis degraded (stop Redis, verify fallback + no catalog search impact)
6. Node A generates / Node B consumes (multi-node Redis)

**Pass criteria:**

- Cold identical context: DB amplification ≪ workers (StampedeSafeCache single-flight)
- Zero 500s on suggestion endpoint
- Catalog search `/catalog/search` unaffected

---

### Gate 4 — Failure combinations

| Scenario | Expected resolution_path | degraded |
|----------|-------------------------|----------|
| Healthy ranking | `fresh_generate` + `display_mode: ranked` | false |
| Ranking empty | `fresh_generate` + `display_mode: initialized` | false |
| DB fail + stale | `stale_cache` | true |
| DB fail, no stale | `registry_only` | true |
| Redis down | `fresh_generate` (direct compute) | false |
| Telemetry fail | any | request still 200 |

---

### Gate 5 — Frontend E2E

**Spec:** `frontend/e2e/filter-suggestions.spec.ts`

```bash
cd frontend
npm run test:e2e -- filter-suggestions.spec.ts
```

**Must verify:**

- Product + service smart filters load and apply
- Initialized fallback (healthy, not degraded banner)
- Degraded banner only when `degraded: true`
- Rapid filter change does not show stale context (React Query + abort)
- Mobile + desktop + RTL + LTR

---

### Gate 6 — Observability

Move from logs-only to metrics where infrastructure exists:

- `filter_suggestion_latency_ms` (histogram by resolution_path)
- `filter_suggestion_db_queries` (histogram on cache miss)
- `filter_suggestion_cache_hit_ratio`
- `filter_suggestion_degraded_ratio` by fallback_reason
- `filter_suggestion_429_total`

---

## Evidence template

Store results under `backend/storage/certification/phase7/`:

```text
explain-analyze-{date}.json
latency-benchmark-{date}.json
stampede-50-{date}.json
stampede-100-{date}.json
e2e-{date}.json
```

Fill the certification checklist before changing verdict to **CERTIFIED**.

---

## What Phase 7 is NOT

- No new ranking algorithms
- No new filter capabilities
- No LLM / AI
- No second search engine

Performance & scale evidence only.
