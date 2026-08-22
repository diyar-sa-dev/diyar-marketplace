# Phase 18.4 — Manual QA Findings Log

**Purpose:** Record every finding during the manual QA pass. Do not silently fix without documenting here first unless the finding is a blocking crash.

**Status:** Not started  
**Operator:** _TBD_  
**Date:** _TBD_

---

## QA order

1. [ ] Admin login/session isolation
2. [ ] English LTR
3. [ ] Arabic RTL
4. [ ] Dashboard
5. [ ] Every Tier 1 resource
6. [ ] Every Tier 2 resource
7. [ ] Tier 3 reports/audit
8. [ ] Settings
9. [ ] Vendor detail tabs
10. [ ] Provider detail tabs
11. [ ] User detail tabs
12. [ ] Direct URL/IDOR checks
13. [ ] Unauthorized permission checks
14. [ ] Mobile/responsive
15. [ ] Error/empty/loading states

---

## Findings

| # | Area | Severity | Finding | Status | Fix reference |
|---|------|----------|---------|--------|---------------|
| | | | | | |

**Severity:** `blocker` · `major` · `minor` · `cosmetic`

**Status:** `open` · `fixed` · `wontfix` · `deferred`

---

## Production checklist

| Item | Verified | Notes |
|------|----------|-------|
| `ext-intl` enabled | ⬜ | |
| `APP_DEBUG=false` | ⬜ | |
| HTTPS | ⬜ | |
| Secure cookies | ⬜ | |
| Production admin provisioning | ⬜ | No `AdminSeeder` dev credentials |
| Secrets/configuration | ⬜ | |
| Cache | ⬜ | |
| Queue workers | ⬜ | |
| Storage | ⬜ | |
| Database | ⬜ | |

---

## Final regression (after fixes)

```text
php artisan test — pending
npm run build — pending
npm run typecheck — pending
```

---

## Sign-off

Stage 18 may move to **COMPLETE / VERIFIED** only when this log has no open `blocker` or `major` items and final regression is green.
