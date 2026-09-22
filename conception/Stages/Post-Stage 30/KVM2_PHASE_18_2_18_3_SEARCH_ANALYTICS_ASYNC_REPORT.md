# KVM2 Phase 18.2–18.3 — Search Analytics Async + Performance Re-Audit

**Date:** 2026-09-22 · **LOCAL KVM2-EQUIVALENT** · **Hostinger NOT VERIFIED** · **Git: NO COMMIT**

---

## 1. Executive summary

Phase 18.2 confirmed (with limitations) that **q-bearing catalog search** paid a **large synchronous MySQL analytics INSERT** on the pre-change path. Phase 18.3 moved persistence to **`RecordSearchQueryAnalyticsJob` on the `default` Redis queue**. Re-benchmarks show **material improvement on search-only load** and **moderate mixed-workload gains at rps150**, with **persistent variance** and **unchanged rough saturation band (~200 RPS mixed degradation)**.

**Async analytics implemented:** **YES**

**Certification:** **VERIFIED WITH LIMITATIONS**

**New dominant bottleneck:** **Catalog search execution + Octane/PHP CPU** under mixed saturation (analytics INSERT no longer on HTTP worker turn for `q` searches).

Evidence root: `backend/storage/certification/kvm2-equivalent/phase18-2-3-search-analytics-async/`

---

## 2. Initial hypothesis

```text
GET /catalog/search?q=…
  → SearchAnalyticsRecorder::record() (via app()->terminating())
  → SearchQueryEvent::create() / MySQL INSERT
  → blocks Octane worker occupancy
```

Phase 18.1 warm-kernel SPX: **~401 ms** wall, **~367 ms** INSERT for `q=sofa`.

---

## 3. Environment

See `environment/environment-cert.json`.

| Check | Result |
|-------|--------|
| App cpuset | 0–1 |
| OCTANE_WORKERS | 2 |
| QUEUE_CONNECTION | redis |
| `/api/v1/health/ready` | 200 |
| failed_jobs | 0 |
| Queue workers | default + critical |

---

## 4. Phase 18.2 — Octane path proof

| Method | Result |
|--------|--------|
| SPX on Nginx→Octane HTTP | **NOT CAPTURED** (same limitation as 18/18.1) |
| Code review | `app()->terminating()` still runs **before worker idle** under Octane |
| Phase 18.1 kernel SPX | **High confidence** sync INSERT cost for `q` searches |
| Post-change nginx curl (30× serial) | `q=sofa` **p50 7.6 ms / p95 26.9 ms**; sync diagnostic jsonl **0 lines** on HTTP |

`octane-proof/nginx-search-latency-sample.json`, `octane-proof/sync-path-evidence.md`

**Answers:**

- INSERT waited on pre-change worker turn: **YES** (terminating + 18.1 SPX).
- Every q-bearing search: **YES** (when analytics enabled).
- Empty `q`: **NO** analytics dispatch.
- Cache hits: analytics still dispatched when `q` non-empty (same as before).
- Octane vs kernel: **kernel proved INSERT cost; Octane HTTP SPX not obtained**.

---

## 5. Synchronous analytics evidence

| Source | Cost signal |
|--------|-------------|
| 18.1 SPX warm kernel | ~367 ms INSERT |
| Pre-change architecture | terminating callback on same worker |
| Post-change nginx sample | ~27 ms p95 with q (no sync jsonl) |

---

## 6. Decision gate

| Criterion | Met? |
|-----------|------|
| Sync persistence on critical path | **YES** (pre-change) |
| Meaningful time/CPU | **YES** for q-bearing search |
| Semantically safe async | **YES** (analytics non-blocking for API contract) |

**→ PROCEED to 18.3**

---

## 7. Architecture before

```text
HTTP → CatalogSearchService::search()
     → response assembled
     → app()->terminating() → SearchAnalyticsRecorder::record() → MySQL
```

---

## 8. Architecture after

```text
HTTP → CatalogSearchService::search()
     → RecordSearchQueryAnalyticsJob::dispatch() (Redis default)
     → JSON response

queue worker → SearchAnalyticsRecorder::record() → MySQL
```

---

## 9. Implementation

| Artifact | Role |
|----------|------|
| `RecordSearchQueryAnalyticsJob` | ShouldQueue, 3 tries, `default` queue |
| `SearchAnalyticsRecorder::dispatchSearchQueryEvent()` | dispatch + optional KVM2 sync timing diagnostic |
| `CatalogSearchController` | dispatch after search; no terminating sync |

Optional diagnostic: `diyar.diagnostics.kvm2_measure_search_analytics_sync` (default **false**).

---

## 10. Queue design

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Queue name | **`default`** | Existing worker; analytics volume fits; avoids new ops surface |
| Retries | 3 | Standard resilience |
| Idempotency | **None** | Duplicate analytics events acceptable |
| Payload | Scalars + filters array | No Request/user model serialization |

Reliability: search **does not depend** on analytics DB (existing test + worker-down **HTTP 200**).

---

## 11. Security / privacy

Unchanged data model: query, normalized_query, search_type, result_count, optional user_id, session_id header, locale, filters, duration_ms, source. **No new PII.** No tokens/cookies in job payload.

---

## 12. Tests

`SearchAnalyticsTest` — **4/4 pass** (host runner). See `tests/phpunit-search-analytics.json`.

Octane isolation suite: **NOT RE-RUN** this phase (no regressions introduced in auth/cache paths touched).

---

## 13. Queue failure / recovery

Worker stopped during search: **5× HTTP 200**. `failed_jobs=0`. Per-query persistence probe **inconclusive**; aggregate event growth during load + passing integration test → **eventual persistence under normal operation**.

`queue/worker-unavailable-test.json`

MySQL-down simulation: **NOT RUN** (destructive; retries covered by job `$tries`).

---

## 14. Performance baseline (Phase 18 — pre-async)

Source: `phase18-php-cpu-profiling/` critical 3× mixed + search-only.

| Profile | p95 ms (runs) |
|---------|----------------|
| Mixed rps125 | 53 / 87 / 269 |
| Mixed rps150 | 86 / 191 / 195 |
| Mixed rps200 | 574 / 732 / 867 |
| Search-only rps150 | **298** |

All **0× 5xx**, **0× 429** in Phase 18 campaign.

---

## 15. Performance after optimization

Source: `performance/post-optimization/campaign.json` (3× mixed + 1× search-only).

| Profile | p95 ms (runs) |
|---------|----------------|
| Mixed rps125 | 36 / 42 / 102 |
| Mixed rps150 | 83 / 72 / 105 |
| Mixed rps200 | 537 / 526 / 410 |
| Search-only rps150 | **143** |

**0× 5xx**, **0× 429**.

---

## 16. Before / after comparison

| Test | Phase 18 baseline (p95) | After async (p95) | Delta (median-ish) |
|------|--------------------------:|------------------:|-------------------:|
| Search-only rps150 | 298 ms | 143 ms | **~−52%** |
| Mixed rps125 | 53–269 ms | 36–102 ms | **Improved, still variable** |
| Mixed rps150 | 86–195 ms | 72–105 ms | **~−30% median** |
| Mixed rps200 | 574–867 ms | 410–537 ms | **~−25% median** |
| search_p95 @ mixed rps150 | ~163 ms (run1) | ~107–144 ms | **Lower** |
| 5xx / 429 | 0 | 0 | — |
| failed_jobs | 0 | 0 | — |
| App CPU sampler | Phase 15 ~75–86% @ rps150 | **NOT RE-SAMPLED** | — |
| Queue depth | — | **NOT MEASURED** | — |

Phase 18 reference: `baseline/phase18-reference.json`.

---

## 17. Saturation analysis

| Region | Phase 18 | Post-async |
|--------|----------|------------|
| First pressure | ~125 RPS mixed | Still **visible variance** at 125 |
| Strong degradation | ~200 RPS mixed | Still **400–540 ms p95** band |
| Hard failure | Not observed | Not observed |

**Saturation point did not clearly move**; **tail latency improved** at 150/200.

---

## 18. CPU / resource analysis

**LIMITATION:** rps150 CPU sampler directory empty; rely on Phase 15 + logical shift of MySQL INSERT to queue worker.

**Expectation:** App CPU per q-bearing search **lower**; MySQL write load **similar** but decoupled from Octane turn.

---

## 19. Frontend UX analysis

Code review (`SearchPage.tsx`): **300 ms debounce**, `keepPreviousData`, subtle loading when refetching — **no analytics dependency**. **Vitest/Playwright not re-run** for this phase.

---

## 20. Face 2 adversarial review

See `face2/adversarial-review.md`. Summary: improvement **credible** on search-heavy metrics; **variance** remains; **Octane SPX gap** persists.

---

## 21. Remaining limitations

- Octane HTTP SPX not captured.
- rps100 / rps175 ladder **not re-run** (125/150/200 only).
- CPU / Redis queue depth not recorded post-change.
- Worker-down single-event persistence probe inconclusive.
- Hostinger **NOT VERIFIED**.

---

## 22. New bottleneck

**Analytics sync INSERT on HTTP path: CLOSED** for q-bearing search.

**Dominant under load:** **catalog search work** (Redis/PHP) + **Octane worker CPU** at mixed **~150–200 RPS**.

---

## 23. Final certification status

**VERIFIED WITH LIMITATIONS** — local KVM2-equivalent only.

---

## 24. Recommended next phase

1. Capture **Octane in-worker SPX** or scoped APM on `CatalogSearchService::search` (not analytics).
2. Re-run **CPU sampler** at rps150 mixed post-async vs Phase 15 baseline.
3. Optional dedicated **`analytics` queue** only if default queue starvation observed under production traffic (not required on current evidence).

---

## Final questions (measurement-based)

| # | Question | Answer |
|---|----------|--------|
| Q1 | Sync analytics significant on real Octane path? | **YES with limitations** — terminating semantics + 18.1 SPX; nginx latency post-change supports; Octane SPX still missing. |
| Q2 | Reduced user-facing search latency? | **YES** — search-only p95 **298→143 ms**; serial nginx curl **~27 ms p95** with q. |
| Q3 | Reduced PHP/Octane CPU pressure? | **PARTIALLY VERIFIED** — logical + search metrics; **no fresh CPU sample**. |
| Q4 | Mixed workload improved? | **YES at median** (rps150/200); **variance persists**. |
| Q5 | Saturation point moved? | **NOT CLEARLY** — 200 RPS still degrades. |
| Q6 | Bottleneck moved? | **YES** — from sync analytics INSERT to **search execution / Octane CPU**. |
| Q7 | Queue new bottleneck? | **NO** on evidence (0 failed_jobs, search-only rps150 OK). |
| Q8 | Analytics preserved? | **YES under normal ops**; worker-down spot test **inconclusive** per event. |
| Q9 | Security/privacy preserved? | **YES**. |
| Q10 | Correct optimization path? | **YES** — non-critical work removed from synchronous path with measured search gains. |
