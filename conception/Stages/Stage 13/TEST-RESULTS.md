# Stage 13 — Test Results

> **Audit date:** 2026-08-18  
> **Environment:** Local Windows · PHP 8.3 · SQLite in-memory (PHPUnit) · Node 20

---

## Stage 13 API suites

| Suite | Result | Count |
|-------|--------|-------|
| `ServiceCatalogTest` | PASS | 12/12 |
| `ServiceRfqWorkflowTest` | PASS | 9/9 |
| **Stage 13 total** | **PASS** | **21/21** |

### ServiceRfqWorkflowTest coverage

- Customer create/list requests  
- Provider offer + customer accept  
- Payment simulate (paid)  
- Provider start + complete after payment  
- Non-provider inbox forbidden (403)  
- Duplicate offer (422)  
- Start before payment (422)  
- Category mismatch on provider detail (403)  
- Cross-provider booking complete (403)  

---

## Full repository suite (pre-commit audit)

| Command | Result |
|---------|--------|
| `vendor/bin/pint --test` | **PASS** |
| `php artisan test` | **PASS — 345/345** |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** |
| `npm run format:check` | **PASS** |
| `npm test` (Vitest) | **PASS — 82/82** |
| `npm run build` | **PASS** |
| `composer validate` | **VALID** (semver warnings on pinned deps only) |

---

## CI alignment

Matches `.github/workflows/ci.yml`:

- Frontend: typecheck → lint → format:check → test → build  
- Backend: pint --test → php artisan test  

**Fix applied:** `DIYAR_MAIL_ENABLED=false` in `backend/phpunit.xml` — prevents local `.env` mail credentials from breaking `EmailVerificationTest` OTP extraction in CI/local.

---

## Known non-blocking warnings

- Vite build chunk size > 500 kB (existing; not Stage 13 regression)  
- Vitest `act(...)` warnings in `AuthContext.test.tsx` (existing)  
- PHP sodium extension warning on local Windows PHP (tests still pass)

---

*Maintained by development team.*
