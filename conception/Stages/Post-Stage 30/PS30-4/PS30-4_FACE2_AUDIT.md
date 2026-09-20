# PS30-4 — Face 2 Audit

**Date:** 2026-09-20

## Severity gate

| P0 | P1 |
|----|-----|
| 0 | 0 |

## Attack matrix

| Area | Attack | Result |
|------|--------|--------|
| Staging smoke | Missing auth on room-designs | **PASS** — smoke.sh expects 401/403 |
| Feature flags | Experimental AI on by default | **PASS** — `.env.staging.example` / diyar defaults false |
| Privacy | External AI in staging smoke | **PASS** — no transfer tests; legal PENDING |
| Deployment | False VPS claim | **PASS** — docs state local/staging only |

## Limitations

| ID | Item |
|----|------|
| F4-01 | `scripts/staging/smoke.sh` not executed in this session |
| F4-02 | Remote `staging.diyar.sa` **NOT VERIFIED** |
| F4-03 | Full staging docker stack **NOT VERIFIED** locally |
