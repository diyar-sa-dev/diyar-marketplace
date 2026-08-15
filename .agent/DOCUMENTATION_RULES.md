# Documentation Rules

> **Status:** CURRENT

---

## Hierarchy

| Location | Purpose |
|----------|---------|
| `conception/` | Product, architecture, business knowledge |
| `.agent/` | AI operational control — current state, rules |
| `conception/Stages/` | Completion reports — permanent historical record |

`.agent/` does **not** replace `conception/`.

---

## Status Labels

Use explicit statuses only:

`REFERENCE — SUPERSEDED`, `BASELINE`, `CURRENT`, `ACTIVE`, `IN PROGRESS`, `BLOCKED`, `COMPLETE`, `FINALIZED`, `DEFERRED`, `OPEN DECISION`

Avoid: "done", "old", "latest", "maybe"

---

## When to Update Docs

| Change | Update |
|--------|--------|
| Phase completed | Phase completion report + `.agent/CURRENT_STATE.md` |
| Architecture fact changed | Relevant ADR, `REQUIREMENTS_BASELINE.md`, architecture docs |
| New env variable | `.env.example` + runbook |
| CI pipeline change | `.github/WORKFLOW.md` or workflow comments |

---

## Completion Report Format

Every phase report must include:

- Date, Stage, Phase, Status
- Objective
- What Was Implemented
- Files / Architecture Changes
- Configuration Changes
- Tests
- Validation
- Documentation Updated
- Decisions / Open Decisions
- Known Risks
- Git State
- Next Phase
- Completion Checklist

---

## Historical Preservation

**Never delete** prior completion reports. Correct factual errors only — do not rewrite history when advancing stages.
