# Face 2 — Adversarial review (Phase 18.2–18.3)

**Reviewer stance:** independent; treat async analytics as unproven until measured.

## Performance

| Challenge | Finding |
|-----------|---------|
| Real improvement vs variance? | **Mixed rps125/rps150/rps200 still multi-modal** (e.g. rps125 p95 36–102 ms). **Search-only rps150 p95 298 → 143 ms** is a large, plausible gain aligned with removing sync INSERT. |
| Identical workloads? | Same k6 script (`kvm2-phase2-diagnostics.js`), same 90s stages, same OCTANE_WORKERS=2, same compose stack. |
| Cache warmth? | Not byte-identical between days; both runs same small catalog (~12 products). |
| Queue warm? | Post-run search-only at rps150 implies queue kept up (0× 5xx). |
| CPU disappeared vs moved? | **MySQL INSERT moved to queue worker**; app-facing search sub-metrics improved. **No fresh app CPU sampler** in this phase (sampler hook failed to persist under `cpu-samples/`). |

## Queue

| Challenge | Finding |
|-----------|---------|
| Actually async? | **Yes** — controller calls `dispatchSearchQueryEvent`; PHPUnit Queue::fake proves no sync insert on HTTP thread. |
| `QUEUE_CONNECTION` | **redis** in app container. |
| Stale workers? | App + queue containers recreated for phase; k6 latency shift supports new code path. |
| failed_jobs | **0** at end of campaign. |
| Depth bounded | **Not measured** (Redis AUTH blocked CLI LLEN during spot check). |

## Octane

| Challenge | Finding |
|-----------|---------|
| Request captured in job? | **No** — job carries scalars + filters array only. |
| Static analytics state? | **None added**. |
| SPX on Octane HTTP | **Still not captured**; Octane proof relies on nginx curl + k6, not in-worker SPX. |

## Security / privacy

| Challenge | Finding |
|-----------|---------|
| New PII? | **No** — same fields as prior `SearchQueryEvent::create`. |
| Tokens in payload? | **No** — user id optional string only. |

## Correctness

| Challenge | Finding |
|-----------|---------|
| Loss / duplication | **At-least-once** queue semantics; duplicates acceptable for analytics (no idempotency key added). |
| Delay | **Expected** seconds-level lag under load; acceptable for analytics. |
| Worker-down spot test | **HTTP 200 confirmed**; single-event DB probe **inconclusive** — treat persistence as **VERIFIED WITH LIMITATIONS** under load only. |

## UX

| Challenge | Finding |
|-----------|---------|
| User faster? | **Serial nginx curl p95 ~27 ms with q** (post-async) vs Phase 18.1 **~401 ms kernel** with sync INSERT — different harness, directionally consistent. Frontend uses React Query + debounce; **no analytics coupling** (code review only, Vitest not re-run). |

## Verdict

**Accept optimization as measured improvement on search-heavy paths**, with **variance** on mixed workload and **missing Octane SPX + CPU sampler** artifacts.
