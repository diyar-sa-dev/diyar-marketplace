# Known Test Gaps

**Updated:** 2026-08-29 — post-implementation closure

---

## Resolved (Phase 28.16)

| # | Gap | Resolution |
|---|-----|------------|
| G1 | No checkout E2E | `frontend/e2e/checkout-journey.spec.ts` |
| G5 | Permission matrix | `PermissionMatrixTest.php` |
| G7 | Redis not in CI | `redis-integration` CI job |
| G3 | Queue worker integration | `QueueWorkerIntegrationTest.php` + CI |
| G2 | Reverb auth untested | `BroadcastChannelAuthorizationTest.php` + sanctum broadcast routes |
| — | k6 wrong script in Docker | `mixed-workload.js` in compose |
| — | 10k catalog slow | Query optimizations + vendor index migration |

---

## Open — Infrastructure / Extended Runtime

| # | Gap | Label | Action |
|---|-----|-------|--------|
| G10 | 15-min soak | NOT RUN | `docker compose -f docker-compose.loadtest.yml --profile k6 run -e RPS_PROFILE=soak15 k6` |
| G4 | E2E SQLite vs MySQL 8 | PARTIAL | CI uses SQLite; loadtest uses MySQL 8 |
| G16 | Multi-node Reverb | ENVIRONMENTAL | Requires Reverb in compose + LB |
| G20 | VPS validation | ENVIRONMENTAL | Deploy target hardware |
| G17 | 100k scale | ENVIRONMENTAL | Extended seed + hardware |

---

## Open — P2 (non-blocking)

| # | Gap |
|---|-----|
| G8 | Affiliate Playwright E2E |
| G12 | Homepage LCP/INP Playwright trace |
| G13 | Automated chaos/failure injection |
| G14 | Open redirect / SSRF dedicated tests |

---

## Certification

P0 repository-controlled gaps: **CLOSED**  
Full platform score: **9.0/10** — see [FINAL_CERTIFICATION.md](./FINAL_CERTIFICATION.md)
