# STAGE 30.14 — Face 2 Audit

**Date:** 2026-09-20

## Severity gate

| P0 | P1 |
|----|-----|
| 0 | 0 |

## Attack matrix

| Area | Attack | Result |
|------|--------|--------|
| Domain purity | Persist projection / Fabric state | **PASS** — projection only in React + `ViewState` |
| Schema | Toggle 2.5D then save | **PASS** — document unchanged; schema v1 |
| Geometry | Inverse iso drag | **PASS** — interaction tests |
| NaN | scale=0 inverse | **PASS** — `isometric25d.test.ts` |
| Interaction | One gesture → one command | **PASS** — existing 30.5 pattern preserved |
| AI privacy | 30.14 diff touches visualization? | **PASS** — no changes; PHPUnit 46/46 |
| Security | New persisted fields | **None** |
| RTL | Mirror world X | **PASS** — canvas LTR neutral |
| Performance | 100-item projection | **Smoke** — `<2ms` batch local (`perspective25d.perf.test.ts`) |

## Accepted limitations (P2/P3)

| ID | Sev | Finding | Disposition |
|----|-----|---------|-------------|
| F14-01 | P2 | Rotated items in iso use Fabric angle, not full OBB projection | **Accepted** — V1.14 visual; domain rotation still correct |
| F14-02 | P2 | Tier-2 images not asynchronously painted on canvas yet | **Accepted** — asset ref + fill hint; lazy image in follow-up |
| F14-03 | P3 | No device QA for iso touch drag | **Deferred** — jsdom interaction only |
| F14-04 | P3 | Server 25d flag not exposed to SPA bootstrap | **Accepted** — client build flag only for 30.14 |
