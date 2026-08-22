# Pre-QA Engineering Gate

**Date:** 2026-08-22  
**Verdict:** **PASS for automated gate** — manual UI QA deferred until Phase 18.4A–E complete

---

## 1. Regression summary (unambiguous)

### Full backend

```text
497 tests
492 passed
5 skipped
0 failed
```

### Admin filter

```text
71 tests
66 passed
5 skipped
0 failed
```

---

## 2. Skipped tests (all five identified)

| Test class | Method context | Skip reason |
|------------|----------------|-------------|
| `AdminTier1ValidationTest` | Filament list rendering | `ext-intl` unavailable |
| `AdminTier2ValidationTest` | Filament list rendering (×2) | `ext-intl` unavailable |
| `AdminTier3ValidationTest` | Filament list rendering | `ext-intl` unavailable |
| `AdminProductsReturnsTest` | Filament list rendering | `ext-intl` unavailable |
| `OrderAuthorizationTest` | subprocess test | Symfony `Process` not available |

**Summary:** 4 skips are **exclusively `ext-intl`**. 1 skip is **Symfony Process** (not intl, not a failure).

Local PHP: `php -m | grep intl` → **empty** (extension not loaded).

Production requirement: enable `ext-intl` before deploy.

---

## 3. Remaining work before manual QA

```text
18.4A  Admin UI/UX design & implementation   ← IN PROGRESS
18.4B  Detail-page UX polish
18.4C  RTL/LTR during UI work
18.4D  Responsive pass
18.4E  Performance + security UI pass
       ↓
MANUAL QA (MANUAL_QA_FINDINGS.md)
       ↓
Production verification
       ↓
STAGE 18 COMPLETE / VERIFIED
```

**Do not start clicking through `/admin` for acceptance until 18.4A–E are done.**

---

## 4. Architecture invariants (automated tests)

| Invariant | Test coverage |
|-----------|---------------|
| Admin guard separate from marketplace | `AdminIsolationTest`, `AdminSecurityHardeningTest` |
| Admin-only blocked from SPA routes | `AdminIsolationTest`, frontend `roles.ts` |
| Marketplace roles blocked from `/admin` | `FilamentAccessTest`, `AdminIsolationTest` |
| Granular permissions | `AdminSecurityHardeningTest`, tier validation tests |
| Relation managers scoped | `AdminOperationalRelationManagersTest` + Eloquent FK relations |

---

## 5. Production seed safety

- `AdminSeeder` dev credentials (`admin@diyar.local` / `Password123!`) must **never** ship to production.
- Production admin provisioning must use secure, one-time setup (env-driven or CLI), with forced rotation.

---

## 6. Documentation status

Stage 18 remains:

> **Functionally Complete, Production Hardening Required**

Not **COMPLETE / VERIFIED** until manual QA + production checklist pass.
