# Phase 28 — Adversarial Production Readiness Certification

**Date:** 2026-09-03 (session 4 — adversarial audit)  
**Verdict:** **NOT PRODUCTION READY** — KVM2 VPS deploy, 48h soak, rollback drill, alert pipeline remain open.

---

## Certification Matrix

| Area | Result | Evidence |
|------|--------|----------|
| Code quality | **PASS** | Hidden E2E bugs fixed (address API path, product pagination key) |
| PHPUnit | **PASS** | 820/820 active (prior) + TrustedProxies + TrustedProxyRateLimit + VercelCrossOrigin |
| Vitest | **PASS** | 181/181 |
| Playwright | **PASS** | 74/74 (2026-09-03 session 4, local E2E stack) |
| Production build | **PASS** | `npm run build`; no secrets in bundle scan |
| Docker | **PASS** | `diyar-production` compose healthy on `:8093` |
| Nginx | **PASS** | CF-Connecting-IP mapping; `/apps/` + `/app/` proxy |
| FPM | **PASS** | `:8092` health 200 |
| Octane | **PASS** | `:8088` multinode; auth isolation 120/120 |
| Auth isolation | **PASS** | Playwright auth-isolation 6/6 + Octane probe |
| Vercel integration | **PASS** | `VercelCrossOriginAuthTest` 2/2 |
| Sanctum/CORS | **PASS** | PHPUnit + Playwright |
| MySQL | **PASS** | Migrations; readiness fails when DB down (expected) |
| Redis | **PASS** | Internal only; `/ready` returns 500 when Redis stopped |
| Queue | **PASS** | Workers running in production compose |
| Scheduler | **PASS** | Container running |
| Reverb | **PASS** | reverb-1/2 healthy; pcntl fix |
| Reverb multi-instance | **PASS** | `stage2817-reverb-multinode.php` 2/2 RECEIVED |
| Rate limiting | **PASS** | `:8093` search 429 @ #61; XFF spoof probe PASS |
| Checkout | **PASS** | Playwright checkout-journey 2/2 |
| Payment | **PASS** | API + UI simulator tests |
| Webhook | **PASS** | Prior session concurrency |
| Payout | **PASS** | Prior session concurrency |
| Backup | **PASS** | Prior session |
| Restore | **PASS** | Prior session |
| Security | **PASS** | TrustedProxies (not `*`); SECURITY.md; env guards |
| Monitoring | **FAIL** | Docs only; no wired alerts |
| Alerts | **FAIL** | Not implemented |
| Deployment | **FAIL** | Not executed on Hostinger KVM2 |
| Rollback | **FAIL** | Not drill-tested on VPS |
| KVM2 capacity | **FAIL** | Local Docker only |
| 48h soak | **FAIL** | Requires real VPS |
| Scale readiness | **PASS** | Architecture documented in deploy/SCALING.md |

---

## Session 4 — Fixes & Probes

### Security / proxy hardening
- Replaced `trustProxies(at: '*')` with `TrustedProxies::addresses()` (private Docker ranges + env override)
- Nginx: `CF-Connecting-IP` → `X-Real-IP` / `X-Forwarded-For` for Cloudflare
- `TrustedProxyRateLimitTest` — rotating spoofed XFF cannot bypass limiter
- `stage2817-adversarial-probes.php` — live/ready, XFF spoof, no stack trace leak

### Infrastructure
- Redis down → `/api/v1/health/ready` HTTP 500 (graceful, no corruption)
- Production compose: only `:8093` published; MySQL/Redis internal

### Playwright fixes (hidden API drift)
- Address endpoint: `/profile/addresses` + required `type`, `recipient_name`, `phone`
- Products list key: `data.items` not `data.products`
- Checkout UI test: hybrid API setup + simulator UI with `?attempt=` param

### Commands run
```bash
php scripts/stage2817-adversarial-probes.php --base=http://127.0.0.1:8093  # PASS
php scripts/stage2817-rate-limit-probe.php --base=http://127.0.0.1:8093    # PASS
php artisan test --filter=TrustedProxy                                      # PASS
npx playwright test                                                           # 74/74 PASS
npm run build                                                                 # PASS
```

---

## Remaining blockers for FULL production readiness

1. Deploy to **Hostinger KVM2** with Cloudflare TLS + Vercel frontend
2. **48h soak** on real VPS with Google SMTP
3. **Rollback drill** on VPS
4. **Monitoring alerts** wired (PagerDuty/Slack/email)
5. **Octane memory leak** extended soak (10k–50k requests) on VPS Octane profile

---

## Recommended production runtime

Based on measured FPM vs Octane (local Docker): **Octane after VPS session soak**, FPM as conservative default in `docker-compose.production.yml`.
