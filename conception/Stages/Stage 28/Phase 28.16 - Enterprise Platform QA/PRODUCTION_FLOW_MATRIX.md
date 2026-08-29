# Production Flow Matrix

Maps **critical business journeys** to verification layers required for production certification.

---

## P0 — Revenue & Trust

| Journey | UI | API | DB | Redis | Queue | WS | Payment |
|---------|:--:|:---:|:--:|:-----:|:-----:|:--:|:-------:|
| Guest browse → product | ✓ | ✓ | — | — | — | — | — |
| Register → login | partial | ✓ | ✓ | — | ✓ | — | — |
| Add to cart → checkout → pay → order | **—** | ✓ | partial | partial | partial | — | ✓ |
| Vendor fulfill order | — | ✓ | partial | — | ✓ | — | — |
| Payment webhook idempotency | — | ✓ | ✓ | — | ✓ | — | ✓ |
| Refund / cancel | — | ✓ | partial | — | partial | — | partial |

---

## P1 — Marketplace Operations

| Journey | UI | API | DB | Queue | WS |
|---------|:--:|:---:|:--:|:-----:|:--:|
| Vendor product CRUD | partial | ✓ | ✓ | — | — |
| Provider booking | partial | ✓ | partial | ✓ | partial |
| B2B RFQ → offer | ✓ | ✓ | partial | ✓ | — |
| Customer chat | ✓ | ✓ | ✓ | ✓ | **—** |
| Notifications | ✓ | ✓ | ✓ | ✓ | **—** |
| Reviews | — | ✓ | ✓ | — | — |
| Coupons | — | ✓ | ✓ | — | — |

---

## P2 — Growth & Admin

| Journey | UI | API |
|---------|:--:|:---:|
| Affiliate tracking | — | ✓ |
| Admin moderation | ✓ | ✓ |
| Analytics dashboards | ✓ | ✓ |
| CMS (blog/B2B) | ✓ | ✓ |
| Loyalty points | ✓ | ✓ |

---

## Production Stack Verification

```text
┌─────────────┐     ┌───────┐     ┌─────────┐
│ React build │ ──► │ Nginx │ ──► │ Octane  │
└─────────────┘     └───────┘     └────┬────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
               ┌────────┐        ┌─────────┐       ┌─────────┐
               │ MySQL 8│        │ Redis 7 │       │ Workers │
               └────────┘        └─────────┘       └────┬────┘
                                                         │
                                                    ┌────▼────┐
                                                    │ Reverb  │
                                                    └─────────┘
```

| Layer | Verified in cert | Method |
|-------|:------------------:|--------|
| React production build | partial | CI build + Playwright preview |
| Nginx | partial | docker-compose.production-like |
| Octane/Swoole | **yes** | docker-compose.loadtest + k6 |
| MySQL 8 | partial | loadtest + CI mysql job |
| Redis 7 | partial | integration tests |
| Queue workers | **no** | GAP |
| Reverb | **no** | GAP |

---

## Certification Command Mapping

| Flow group | Tier | Command segment |
|------------|------|-----------------|
| Unit + API | quick | `php artisan test` |
| Frontend | quick | `npm run test` |
| E2E smoke | e2e | `npx playwright test` |
| Commerce API | full | checkout/payment test filter |
| Security | security | RateLimit + Upload + IDOR subset |
| Capacity | load | k6 mixed rps10/25/50 |
| Soak | certification | k6 soak15 |

---

## Deployment Readiness Gates

Before production deploy, certification must show:

- [ ] P0 commerce API green
- [ ] P0 commerce E2E green (when implemented)
- [ ] Permission matrix green
- [ ] k6 50 RPS mixed PASS
- [ ] Redis integration green
- [ ] No P0/P1 open in ISSUE_REGISTER
- [ ] Evidence archived in `_raw/`
