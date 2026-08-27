# Dependency Graph — Stage 28

**Date:** 2026-08-27

Shows what must happen before downstream work.

---

## Graph (ASCII)

```text
┌─────────────────────────────────────────────────────────────────┐
│ RELEASE DECISIONS (28.8 blockers)                                │
├─────────────────────────────────────────────────────────────────┤
│ KI-028-053 assistant decision                                    │
│ BLOCK-002 bcmath verify on Hostinger                             │
│ KI-028-030 MySQL8 full suite OR sign-off                         │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────┐     ┌──────────────────────────────┐
│ OPT-INFRA-002 bcmath Docker│     │ OPT-INFRA-003 MySQL8 CI job  │
└────────────┬───────────────┘     └──────────────┬───────────────┘
             │                                     │
             ▼                                     ▼
┌────────────────────────────┐     ┌──────────────────────────────┐
│ Full k6 profiles.js        │     │ Engine parity confidence     │
│ /products load valid       │     │ for production sign-off      │
└────────────┬───────────────┘     └──────────────────────────────┘
             │
             ▼
┌────────────────────────────┐
│ OPT-API-003 checkout load  │
│ OPT-API-004 analytics HTTP │
└────────────────────────────┘

┌────────────────────────────┐
│ PerformanceDatasetSeeder   │
│ large tier (100×)          │
└────────────┬───────────────┘
             ▼
┌────────────────────────────┐
│ OPT-DB-001 index decision  │
│ OPT-DB-003 admin @ 10k     │
│ (evidence-based only)      │
└────────────────────────────┘

┌────────────────────────────┐
│ KI-028-054 fix RateLimit   │
│ tests                      │
└────────────┬───────────────┘
             ▼
┌────────────────────────────┐
│ CI rate-limit regression   │
│ protection claim           │
└────────────────────────────┘

┌────────────────────────────┐
│ KI-028-055 B2B sanitize    │
└────────────┬───────────────┘
             ▼
┌────────────────────────────┐
│ Admin preview XSS risk     │
│ closed                     │
└────────────────────────────┘

┌────────────────────────────┐
│ KI-028-048 CI-parity seed  │──► E2E certification valid
└────────────────────────────┘
             │
             ▼
┌────────────────────────────┐
│ KI-028-051/052 test fixes  │
└────────────┬───────────────┘
             ▼
┌────────────────────────────┐
│ 72/72 E2E target           │
└────────────────────────────┘

┌────────────────────────────┐
│ OPT-FE-003 ad popup fix    │
└────────────┬───────────────┘
             ▼
┌────────────────────────────┐
│ KI-028-050 closed          │
│ Projects E2E stable        │
└────────────────────────────┘

┌────────────────────────────┐
│ Hostinger staging deploy   │
└────────────┬───────────────┘
             ▼
┌────────────────────────────┐
│ OPT-NETWORK-001 VPS load   │
│ OPT-NETWORK-002 60m soak   │
└────────────────────────────┘
```

---

## Critical path to production sign-off

1. **Assistant decision** (KI-028-053)
2. **Hostinger bcmath + env checklist** (BLOCK-002)
3. **MySQL 8 parity decision** (KI-028-030)
4. **Recommended:** KI-028-055 sanitize, KI-028-054 rate-limit tests
5. **Staging benchmark** (OPT-NETWORK-001) before public scale claims

---

## Parallel tracks (independent)

| Track | Can start anytime |
|-------|-------------------|
| Test hygiene (021, 051, 049, 014) | Yes |
| OPT-FE-001 bundle split | After release if accepted |
| OPT-DB-001 | Only after large-tier measurement |
| Local dev isolation (020, 023) | 28.14 |

---

## Certification

```text
Dependencies identified: YES
Optimization order defined: YES
```
