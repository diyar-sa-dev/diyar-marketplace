# DIYAR — AI Agent Operating System

> **Status:** CURRENT  
> **Purpose:** Permanent protocol for AI-assisted development on DIYAR Marketplace

---

## Before Every Implementation

Every development request **must** begin by checking, in order:

1. `.agent/CURRENT_STATE.md`
2. `.agent/DEVELOPMENT_RULES.md`
3. `.agent/ARCHITECTURE_RULES.md`
4. `conception/REQUIREMENTS_BASELINE.md`
5. `conception/MASTER_DEVELOPMENT_PLAN.md`
6. Current Stage completion report(s)
7. Current Phase / Task documentation
8. Relevant `conception/architecture/*`, `conception/business/*`, `conception/adr/*`
9. Actual repository state (code wins over stale docs)

The agent must know **before coding**:

| Field | Source |
|-------|--------|
| Current Stage | `.agent/CURRENT_STATE.md` |
| Current Phase | `.agent/CURRENT_STATE.md` |
| Current Task | `.agent/CURRENT_STATE.md` |
| Previous completed work | Latest completion report |
| Next authorized work | `.agent/CURRENT_STATE.md` |

---

## Delivery Protocol

```
STAGE → PHASE → TASK → SUBTASK → IMPLEMENTATION → VALIDATION → COMPLETION REPORT
```

Every completed Stage, Phase, or meaningful Task produces a permanent report under:

```
conception/Stages/Stage {N}/Phase {N}.{M}/PHASE_{N}.{M}_COMPLETION_REPORT.md
```

Update `.agent/CURRENT_STATE.md` after each completion. **Never delete** historical reports.

---

## Scope Control

- Implement **only** the authorized Stage / Phase / Task.
- Stage 1 = engineering foundation. **No V1 business domains.**
- Stage 2+ = Identity, then business domains.
- Sanctum **infrastructure** in Stage 1; **authentication workflows** in Stage 2.
- Do not silently expand scope.

---

## Architecture Authority

When documentation conflicts, priority is:

1. Current repository + ADRs (finalized decisions)
2. `REQUIREMENTS_BASELINE.md`
3. `MASTER_DEVELOPMENT_PLAN.md`
4. Older docs marked REFERENCE — SUPERSEDED

**Confirmed baseline (Stage 0+):**

| Layer | Choice |
|-------|--------|
| Backend | Laravel 13, PHP 8.3+ |
| Database | MySQL 8 |
| Cache | Laravel Cache (no Redis V1) |
| Queue | Database queue |
| API | REST `/api/v1` |
| Auth infra | Laravel Sanctum |
| Frontend | React 19, TypeScript, Vite, Tailwind |
| Data fetching | TanStack Query + Axios |

---

## Change Management

Require a new ADR when changing: database, auth mechanism, API style, Redis, WebSockets, payment architecture, modular boundaries, microservices, financial model, storage architecture.

---

## Validation Gate

A phase is **not complete** until: implementation + tests + build + lint + type check + architecture review + documentation + repository verification.

---

## Related Documents

| File | Purpose |
|------|---------|
| `CURRENT_STATE.md` | Live project position |
| `DEVELOPMENT_RULES.md` | Workflow and git rules |
| `ARCHITECTURE_RULES.md` | Technical constraints |
| `CODING_RULES.md` | Code style and conventions |
| `DOCUMENTATION_RULES.md` | Doc sync requirements |
| `QA_RULES.md` | Testing expectations |
| `STAGE_PROTOCOL.md` | Stage/phase/task hierarchy |
| `CONTEXT.md` | Product and domain summary |
