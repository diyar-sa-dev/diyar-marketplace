# Phase 28.5 — E2E Test Strategy

---

## Objective

Prove the **complete DIYAR system** works when Browser → React → Laravel → DB → Redis operate together.

**Rule:** TEST → OBSERVE → CLASSIFY → DOCUMENT — no optimization.

---

## Test layers

| Layer | Tool | Scope |
|-------|------|-------|
| E2E browser | Playwright 1.62 | 72 tests (39 original + 33 Phase 28.5 additions) |
| API direct | Playwright `request` | Auth isolation, seed verification |
| Cross-layer | E2E + API probes | Order/blog/B2B persistence implied by journey tests |

---

## Environment policy

| Label | Meaning |
|-------|---------|
| **CI-parity** | SQLite + full seed + preview :3000 |
| **Dev-parity** | MariaDB + composer dev (not E2E certified) |

E2E certification requires **CI-parity** stack.

---

## New Phase 28.5 specs (test infrastructure)

| File | Purpose |
|------|---------|
| `responsive-smoke.spec.ts` | Viewport overflow matrix (KI-028-045) |
| `projects-modal-regression.spec.ts` | KI-028-041 investigation |
| `upload-smoke.spec.ts` | Upload integration attempt (KI-028-046) |

These do **not** change application behavior.

---

## Carry-forward exclusions

- No load testing (→ 28.7)
- No security penetration (→ 28.6)
- No French locale (N/A)
- No PostgreSQL

---

## Exit criteria mapping

See `E2E_CERTIFICATION.md` for gate table.
