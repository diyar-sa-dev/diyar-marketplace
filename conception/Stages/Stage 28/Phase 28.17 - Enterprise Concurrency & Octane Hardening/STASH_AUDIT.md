# Stash Audit — Phase 28.17

**Date:** 2026-09-03  
**Phase:** 28.17 — Enterprise Concurrency & Octane Hardening  
**Source:** Phase 0 git audit (branch `dev`, HEAD `5446fb5`)

---

## Summary

| Field | Value |
|-------|-------|
| Stash ref | `stash@{0}` |
| Message | `WIP: Phase 28.17 Octane concurrency, auth isolation, payments race fixes` |
| Files | 48 (+1168 / −270 lines) |
| Applied? | **No** — conflicts with ~149 modified/untracked working-tree files |
| Integrity | **PARTIALLY VERIFIED** — config references missing listener classes |

**Working tree is authoritative.** Stash is a partial snapshot from an earlier Octane/auth/payments WIP session and must not be applied wholesale.

As of **2026-09-03**, Octane auth/session listeners were **re-implemented in HEAD** (not via stash apply). Stash remains reference-only.

---

## Classification Table — Key File Groups (`stash@{0}`)

| Group | Files (representative) | Classification | Rationale |
|-------|------------------------|----------------|-----------|
| **Octane listeners + config** | `config/octane.php`, (missing listener classes in stash) | **Already implemented better** | HEAD has `FlushAuthAndSessionState`, `PersistApplicationSession`, `EnsureCleanAuthState` middleware + tests; stash config was incomplete blueprint |
| **Auth / session services** | `AuthService.php`, `session.php`, `bootstrap/app.php` | **Needs manual adaptation** | Stash diffs useful for logout/session tuning; working tree diverged (~149 files); cherry-pick per hunk |
| **Payment finalization** | `PaymentFinalizationService.php` | **Already implemented better** | `lockForUpdate` present in HEAD; stash diff largely superseded |
| **Webhook processor** | `PaymentWebhookEventProcessor.php`, `PaymentWebhookEvent.php` | **Already implemented better** | Lease + model in HEAD with `PaymentWebhookProcessingLeaseTest` |
| **Payment application** | `PaymentApplicationService.php` | **Needs manual adaptation** | Initiate race guards in stash; compare to HEAD before merge |
| **Order cancellation** | `OrderCancellationService.php` | **Still needed** | Cancel/refund concurrency audit not done; stash diff unreviewed |
| **OTP / identity static state** | `EmailOtpService.php`, `OtpService.php` | **Needs manual adaptation** | Octane static-state risk; dev flush exists via `FlushOctaneDevState` |
| **Docker / Octane image** | `Dockerfile.octane`, `.dockerignore` | **Needs manual adaptation** | Compare worker/max_request defaults to HEAD compose |
| **Auth / payment tests** | `AuthenticationTest.php`, `PaymentWebhookSecurityTest.php`, `InteractsWithIdentity.php` | **Needs manual adaptation** | HEAD has `AuthSessionIsolationTest`; stash test diffs may conflict |
| **Catalog / assistant / frontend UI** | CategoryController, Assistant*, AppPromo, AuthPage, etc. | **Obsolete** (for 28.17) | Unrelated to concurrency scope; working tree has newer changes |
| **Whole stash apply** | All 48 files | **Conflicts** | ~149 modified/untracked files; wholesale pop **BLOCKED** |
| **Env / i18n / routes** | `.env.example`, `lang/*`, `web.php` | **Needs manual adaptation** | Compare individually; low 28.17 priority |

---

## Critical Gap — Referenced but Missing from Stash (historical)

| Referenced in stash `octane.php` | Present in stash tree? | Status |
|----------------------------------|------------------------|--------|
| `App\Listeners\Octane\FlushAuthAndSessionState` | **No** | **BLOCKED** — would fatal on Octane boot |
| `App\Listeners\Octane\PersistApplicationSession` | **No** | **BLOCKED** — would fatal on Octane boot |
| `App\Listeners\Octane\EnsureCleanAuthState` | Not referenced in stash | **NOT VERIFIED** — mentioned in planning; not in stash config |
| `App\Listeners\Octane\FlushOctaneDevState` | Yes | **VERIFIED** |

Stash `octane.php` also adds `'flush' => ['auth', 'auth.driver', 'session.store', …]` — listener implementations to honor that flush list were never stashed.

---

## File Inventory

| # | Path | Domain | Stash relevance | Recover? |
|---|------|--------|-----------------|----------|
| 1 | `README.md` | Docs | Minor | Low priority |
| 2 | `backend/.dockerignore` | Octane/Docker | Loadtest image context | Cherry-pick if needed |
| 3 | `backend/.env.example` | Config | Session/Octane env hints | Compare to working tree |
| 4 | `backend/Dockerfile.octane` | Octane | Swoole worker CMD | **PARTIALLY VERIFIED** — compare to HEAD |
| 5 | `backend/app/Http/Controllers/Api/V1/Catalog/CategoryController.php` | Catalog | Unrelated to 28.17 core | Skip |
| 6 | `backend/app/Http/Requests/Assistant/AssistantChatRequest.php` | Assistant | Unrelated | Skip |
| 7 | `backend/app/Http/Resources/CategoryResource.php` | Catalog | Unrelated | Skip |
| 8 | `backend/app/Models/PaymentWebhookEvent.php` | Payments | Webhook idempotency model | Review for race fixes |
| 9 | `backend/app/Services/Assistant/AssistantChatService.php` | Assistant | Unrelated | Skip |
| 10 | `backend/app/Services/Assistant/AssistantSystemPromptBuilder.php` | Assistant | Unrelated | Skip |
| 11 | `backend/app/Services/Catalog/CatalogSearchService.php` | Catalog | Unrelated | Skip |
| 12 | `backend/app/Services/Identity/AuthService.php` | Auth | Session/guard isolation intent | **PARTIALLY VERIFIED** — manual diff |
| 13 | `backend/app/Services/Identity/EmailOtpService.php` | Auth/OTP | Static-state under Octane | Review |
| 14 | `backend/app/Services/Identity/OtpService.php` | Auth/OTP | Static-state under Octane | Review |
| 15 | `backend/app/Services/Media/MediaUploadService.php` | Media | Unrelated | Skip |
| 16 | `backend/app/Services/Order/OrderCancellationService.php` | Orders | Concurrency adjacent | Review |
| 17 | `backend/app/Services/Payments/PaymentApplicationService.php` | Payments | Initiate race guards | **PARTIALLY VERIFIED** |
| 18 | `backend/app/Services/Payments/PaymentFinalizationService.php` | Payments | `lockForUpdate` finalization | **VERIFIED** in HEAD (may differ) |
| 19 | `backend/app/Services/Payments/PaymentWebhookEventProcessor.php` | Payments | Webhook replay/idempotency | **PARTIALLY VERIFIED** |
| 20 | `backend/bootstrap/app.php` | Bootstrap | Middleware/session bootstrap | Review for Octane |
| 21 | `backend/config/diyar.php` | Config | Payment/feature flags | Compare |
| 22 | `backend/config/filesystems.php` | Config | Minor | Skip |
| 23 | `backend/config/octane.php` | **Octane** | Auth/session listeners + flush list | **BLOCKED** — incomplete |
| 24 | `backend/config/session.php` | **Auth/Session** | Redis session driver tuning | **PARTIALLY VERIFIED** |
| 25 | `backend/lang/ar/diyar.php` | i18n | Unrelated strings | Skip |
| 26 | `backend/lang/en/diyar.php` | i18n | Unrelated strings | Skip |
| 27 | `backend/routes/web.php` | Routes | Minor | Skip |
| 28 | `backend/tests/Concerns/InteractsWithIdentity.php` | Tests | Auth test helpers | Review |
| 29 | `backend/tests/Feature/Api/V1/Assistant/AssistantChatTest.php` | Tests | Unrelated | Skip |
| 30 | `backend/tests/Feature/Api/V1/Auth/AuthenticationTest.php` | **Auth tests** | Guard/session assertions | Review |
| 31 | `backend/tests/Feature/Api/V1/Auth/SmsProviderTest.php` | Tests | OTP flush behavior | Review |
| 32 | `backend/tests/Feature/Api/V1/Catalog/CatalogSearchTest.php` | Tests | Unrelated | Skip |
| 33 | `backend/tests/Feature/Api/V1/Payment/PaymentWebhookSecurityTest.php` | **Payments** | Webhook security | Review |
| 34 | `frontend/package.json` | Frontend | Deps | Skip |
| 35 | `frontend/src/api/assistant.ts` | Frontend | Unrelated | Skip |
| 36 | `frontend/src/api/auth.ts` | Frontend | Auth client | Skip |
| 37 | `frontend/src/components/home/sections/AppPromo.tsx` | Frontend | UI | Skip |
| 38 | `frontend/src/components/home/sections/FeaturedStores.tsx` | Frontend | UI | Skip |
| 39 | `frontend/src/components/layout/SidebarMenu.tsx` | Frontend | UI | Skip |
| 40 | `frontend/src/context/AuthContext.tsx` | Frontend | Client auth state | Skip for 28.17 |
| 41 | `frontend/src/hooks/assistant/useAssistantCatalog.ts` | Frontend | Unrelated | Skip |
| 42 | `frontend/src/index.css` | Frontend | Styles | Skip |
| 43 | `frontend/src/lib/categoryChildren.ts` | Frontend | Unrelated | Skip |
| 44 | `frontend/src/lib/csrf.ts` | Frontend | CSRF/session client | Review |
| 45 | `frontend/src/lib/i18n/locales/ar.ts` | i18n | Strings | Skip |
| 46 | `frontend/src/lib/i18n/locales/en.ts` | i18n | Strings | Skip |
| 47 | `frontend/src/pages/AIDesignerPage.tsx` | Frontend | Unrelated | Skip |
| 48 | `frontend/src/pages/AuthPage.tsx` | Frontend | UI | Skip |

---

## Recommended Recovery Strategy

1. **Do not** `git stash pop` — working tree (~149 files, PO/finance/chat/RFQ/reviews) is authoritative.
2. **Re-implement** Octane auth/session listeners from scratch (stash config is a blueprint only).
3. **Cherry-pick diffs** from stash for `PaymentFinalizationService`, `PaymentWebhookEventProcessor`, `AuthService`, `session.php` via `git stash show -p stash@{0} -- <path>`.
4. Drop stash after listener classes land and Octane boot is **VERIFIED** in loadtest stack.

---

## Verdict

| Item | Status |
|------|--------|
| Stash completeness | **NOT VERIFIED** |
| Safe to apply as-is | **BLOCKED** |
| Useful as reference | **PARTIALLY VERIFIED** |
| Octane P0 items recovered via HEAD re-implementation | **VERIFIED** (2026-09-03) |
| Remaining stash value (cancellation, payment app diffs) | **PARTIALLY VERIFIED** |
