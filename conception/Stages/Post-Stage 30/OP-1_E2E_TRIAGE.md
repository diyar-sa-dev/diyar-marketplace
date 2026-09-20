# OP-1 — E2E failure triage (2026-09-20)

Original full-suite run: **82 pass / 11 fail / 1 skip** (`OP-1_playwright_run_2026-09-20.txt`, workers=2).

## Per-failure record

| # | Test | Root cause | Classification | Fix |
|---|------|------------|----------------|-----|
| 1 | analytics — vendor period selector | `#login-phone` timeout under parallel load on `artisan serve` | FLAKY/CONCURRENCY + ENV | `ui-auth` waitFor + domcontentloaded |
| 2 | blog — listing / detail | `networkidle` never settled (long-polling / SPA) | TEST BUG | `domcontentloaded`, longer h1 timeout |
| 3 | filter-suggestions — products UI | ar-SA locale + text matcher; aside heading | TEST BUG | Desktop viewport, `getByRole('heading')`, AR+EN strings |
| 4 | filter-suggestions — services UI | `/services` has no suggestions UI; no search context | STALE TEST | `/search?type=services&q=service` + heading assert |
| 5 | messaging — admin chat reports | Admin login timeout under load | FLAKY/CONCURRENCY | Same `ui-auth` hardening |
| 6 | provider — dashboard login | Same as #1 | FLAKY/CONCURRENCY | Same |
| 7 | room-designer — mobile catalog | Parallel login / slow shell; missing session headers on API (earlier) | TEST BUG + FLAKY | Serial UI block; Sanctum headers (prior slice) |
| 8 | two-factor — E2E-03/04 | OTP test mode not in bootstrap; wrong 2FA status JSON path; CSRF after login challenge | BOOTSTRAP + TEST BUG | `DIYAR_OTP_TEST_MODE`; `data.enabled`; refresh CSRF on verify |
| 9 | upload-smoke — vendor logo | Missing `after.png` fixture path | TEST BUG | `e2e/fixtures/store-logo.png` |
| 10 | visual-search — EN | Default ar-SA; desktop `/search` has no image-search control (mobile-only bar) | TEST BUG | `setMarketplaceLocale('en')`, mobile viewport |
| 11 | (parallel-only extras) | auth-isolation, b2b-admin, loyalty, responsive auth | TEST BUG / FLAKY | Admin waitFor; loyalty domcontentloaded; `#login-phone` → login submit testid |

**No production auth bypasses introduced.** Bootstrap OTP test mode is **local/testing only** (existing `OtpTestCodeResolver` guard).

## Post-fix runs

| Run | Pass | Fail | Skip | Workers | Log |
|-----|------|------|------|---------|-----|
| Initial | 82 | 11 | 1 | 2 | `OP-1_playwright_run_2026-09-20.txt` |
| After fixes | 86 | 5 | 1 | 2 | `OP-1_playwright_run_2026-09-20_r2.txt` |
| After fixes | **93** | **0** | **1** | **1** | `OP-1_playwright_run_2026-09-20_w1.txt` |

Expected skip: room-designer negative case when AI spatial enabled in bootstrap.

## Face 2 notes

- Session/CSRF fixes **strengthen** E2E fidelity (no weakened Sanctum).
- 2FA cleanup uses real disable flow; serial 2FA describe avoids customer state leak.
- Parallel workers=2 on single-threaded `php artisan serve` remains **environment-sensitive**; CI Ubuntu + Redis + scripted bootstrap is authoritative.

## OP-1 gate (local)

```text
Full Playwright (workers=1, CI-parity local stack): 93/93 executed, 1 skip — PASS
Full Playwright (workers=2, same stack):             86/94 — NOT STABLE (concurrency)
GitHub Actions E2E:                                  NOT RUN from this environment
```

**Full E2E certification:** **VERIFIED WITH LIMITATIONS** (local serial green; CI not executed; parallel local flaky).
