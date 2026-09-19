# STAGE 30.12 — Face 2 Adversarial Audit (Senior Re-verification)

**Date:** 2026-09-19 (independent senior pass)  
**Reviewer stance:** Assume prior certification may be wrong; verify against code + executed tests.

## Gate summary

| Severity | Count | Policy |
|----------|-------|--------|
| P0 | 0 | Must stay 0 |
| P1 | 0 | Must stay 0 |
| P2 (accepted) | 3 | Documented below |
| P3 | 4 | Documented below |

**Face 2 result:** PASS — no P0/P1 open after fixes in this pass.

---

## Findings (evidence-backed)

| ID | Sev | Finding | Evidence | Fix / disposition | Regression |
|----|-----|---------|----------|-------------------|------------|
| F2-01 | P2 | Application `timeout_seconds` measured only after synchronous `process()` returns; hung provider relies on queue job timeout (120s). | `VisualizationService.php` L45–54; `ProcessTryInRoomJob::$timeout` | **Accepted** — no external HTTP in 30.12; 30.13 must add client timeouts. | N/A |
| F2-02 | P2 | Daily quota consumed before provider call; failed attempts do not refund. | `VisualizationService::execute` order; `DEPLOYMENT_AND_SCALING.md` | **Accepted** — V1 product decision (PREPARED). | Quota tests |
| F2-03 | P2 | Job can remain `processing` if worker dies after `claimForProcessing` (retry cannot re-claim). | `ProcessTryInRoomJob` L51–52; `claimForProcessing` Queued-only | **Accepted** — pre-30.11 worker semantics; out of 30.12 scope. | Existing claim tests |
| F2-04 | P3 | Circuit breaker counter uses read/increment/put (not atomic INCR). | `VisualizationService::recordProviderFailure` | **Accepted** — bounded cooldown; open still blocks provider. | Circuit test |
| F2-05 | P3 | Default `driver=null` + `ai_visualization_enabled=false` fails jobs until `stub` configured. | `config/diyar.php`; `.env.example` | **By design** — safe rollback. | `ai_visualization_disabled` test |
| F2-06 | P3 | Prior worker test did not prove single visualization invocation. | Code review of `TryInRoomWorkerConcurrencyTest` | **Fixed** — `ProcessTryInRoomJobVisualizationTest` mocks `execute()` once. | New job unit tests |
| F2-07 | P3 | `VisualizationProviderInterface` container binding resolves driver at first resolve (stale if config changes at runtime). | `AppServiceProvider` | **Accepted** — production path uses `VisualizationService` + per-call `registry->resolve()`. | STATICALLY VERIFIED |
| F2-08 | P3 | `provider_malformed_response` branch hard to hit with typed PHP providers (non-array return → `TypeError` → `processing_failed`). | PHP return types on interface | **Accepted** — defensive branch for future loose adapters. | STATICALLY VERIFIED |

---

## Attack matrix (executed vs static)

| Scenario | Result | Classification |
|----------|--------|----------------|
| driver = null, AI off | `ai_visualization_disabled` | TEST VERIFIED |
| driver = stub, AI off | success | TEST VERIFIED |
| unknown driver | `provider_configuration_invalid` | TEST VERIFIED |
| provider throws | mapped failure code | TEST VERIFIED |
| quota exhausted | `quota_exhausted` | TEST VERIFIED |
| circuit open | `provider_circuit_open`, resolve not called | TEST VERIFIED |
| duplicate handle (completed path) | `VisualizationService::execute` once | TEST VERIFIED |
| job already processing | no `execute` | TEST VERIFIED |
| atomic claim queued→processing | one winner | TEST VERIFIED |
| client selects provider | no API field | STATICALLY VERIFIED |
| secrets in API | `provider_key` not in `TryInRoomJobResource` | STATICALLY VERIFIED |
| multi-worker Redis quota race | not executed | **NOT VERIFIED IN PRODUCTION** |

---

## Security red team (30.12 scope)

- No vendor SDKs or HTTP clients in application layer — **STATICALLY VERIFIED**
- No `VITE_*` visualization secrets — **STATICALLY VERIFIED**
- Try-in-room authorization unchanged — **TEST VERIFIED** (security feature suite)
- Configurable provider URLs — **none** in 30.12 — SSRF N/A

---

## Privacy

- **30.12:** No external AI transmission — **ARCHITECTURALLY VERIFIED**
- **30.13 gate:** Legal/privacy sign-off required before user imagery leaves the platform — **DEFERRED BY DESIGN**
