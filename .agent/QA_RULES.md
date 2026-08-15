# QA Rules

> **Status:** CURRENT

---

## Stage 1 Testing Scope

Stage 1 establishes **foundation only**. Full domain test coverage comes in later stages.

---

## Backend (PHPUnit)

| Area | Stage 1 Expectation |
|------|---------------------|
| Health endpoint | Feature test required |
| API JSON errors | Feature test for 404/validation patterns |
| Unit structure | `tests/Unit/` scaffold |
| Database testing | SQLite in-memory for CI |
| Factories | User factory exists (Laravel default) |

**Critical domains (Stage 2+)** requiring tests when implemented:

- Authorization
- Inventory
- Checkout
- Payments
- Financial ledger
- Commission
- Orders
- Returns
- Services

---

## Frontend (Vitest)

| Area | Stage 1 Expectation |
|------|---------------------|
| Utility functions | Unit tests |
| API error parsing | Unit test |
| Components | Minimal smoke test scaffold |
| Hooks | Test when non-trivial |

---

## Validation Checklist (Per Phase)

- [ ] Implementation complete
- [ ] Tests pass
- [ ] Build passes (`npm run build`)
- [ ] Lint / type check passes
- [ ] Backend `php artisan test` passes
- [ ] Architecture aligns with ADRs
- [ ] Documentation updated
- [ ] `.agent/CURRENT_STATE.md` updated
- [ ] No unauthorized business logic introduced

---

## CI Quality Gates (Phase 1.5)

On push/PR to `dev` and `main`:

1. Install dependencies (frontend + backend)
2. Frontend lint + type check
3. Frontend tests
4. Frontend build
5. Backend Pint (dry-run)
6. Backend tests
