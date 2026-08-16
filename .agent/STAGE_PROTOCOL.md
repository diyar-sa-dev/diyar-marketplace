# Stage Protocol

> **Status:** CURRENT

---

## Hierarchy

```
STAGE
  └── PHASE
        └── TASK (optional)
              └── SUBTASK (optional)
                    └── IMPLEMENTATION
                          └── VALIDATION
                                └── COMPLETION REPORT
```

---

## Stage Map (High Level)

| Stage | Name | Scope |
|-------|------|-------|
| 0 | Discovery & Architecture | **FINALIZED** |
| 1 | Engineering Foundation | Laravel + React foundation, CI, security infra |
| 2 | Identity & Access | **FINALIZED** — Sanctum, OTP, roles, frontend auth |
| 3+ | Business Domains | Per MASTER_DEVELOPMENT_PLAN — **NOT AUTHORIZED** |

---

## Stage 1 Phases

| Phase | Deliverable |
|-------|-------------|
| 1.1 | Backend foundation — verify/harden Laravel 13 |
| 1.2 | Frontend foundation — Axios, TanStack Query, architecture |
| 1.3 | Development standards — ESLint, Prettier, Pint, editorconfig |
| 1.4 | Testing foundation — PHPUnit + Vitest scaffold |
| 1.5 | CI / quality gates — monorepo pipeline |
| 1.6 | Security / API / ops — rate limits, response conventions, Sanctum config |

**Dependency order:** 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6

Partial parallelization allowed only when dependencies are satisfied.

---

## Report Locations

```
conception/Stages/Stage 1/
├── Phase 1.1/PHASE_1.1_COMPLETION_REPORT.md
├── Phase 1.2/PHASE_1.2_COMPLETION_REPORT.md
├── Phase 1.3/PHASE_1.3_COMPLETION_REPORT.md
├── Phase 1.4/PHASE_1.4_COMPLETION_REPORT.md
├── Phase 1.5/PHASE_1.5_COMPLETION_REPORT.md
├── Phase 1.6/PHASE_1.6_COMPLETION_REPORT.md
└── STAGE_1_COMPLETION_REPORT.md
```

---

## Authorization Rule

If asked to implement Phase X.Y, do **not** implement work from Phase X.Z or later stages unless explicitly authorized.

---

## Stage 2 Success Criteria

Stage 2 is FINALIZED when phases 2.1–2.8 are complete, tests pass, and `.agent/CURRENT_STATE.md` marks Stage 3 as **NOT AUTHORIZED** until explicitly requested.

Report: `conception/Stages/Stage 2/STAGE_2_COMPLETION_REPORT.md`
