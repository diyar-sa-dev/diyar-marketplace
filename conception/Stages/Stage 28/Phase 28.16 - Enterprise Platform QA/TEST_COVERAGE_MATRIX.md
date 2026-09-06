# Test Coverage Matrix

**Derived from:** PHPUnit grep, Playwright inventory, Vitest inventory  
**Updated:** 2026-08-29

---

## Backend Feature Coverage (PHPUnit)

| Domain | Test files | Approx tests | Depth |
|--------|----------:|-------------:|-------|
| Auth / Identity | 8+ | 40+ | Strong |
| Catalog / Products | 15+ | 80+ | Strong |
| Cart / Checkout | 5+ | 35+ | Strong (API) |
| Orders / Shipping | 10+ | 50+ | Strong |
| Payments / Webhooks | 8+ | 45+ | Strong (idempotency) |
| Returns / Refunds | 3+ | 11+ | API only |
| Vendor | 12+ | 60+ | Strong |
| Provider | 6+ | 30+ | Good |
| Affiliate | 4+ | 18+ | API only |
| B2B | 8+ | 40+ | Good |
| Admin | 20+ | 100+ | Strong |
| Chat | 4+ | 20+ | API + broadcast fake |
| Notifications | 5+ | 25+ | Good |
| Loyalty / Coupons | 6+ | 30+ | Good |
| Security / Rate limit | 5+ | 25+ | Good |
| Settings / Config | 4+ | 15+ | Good |
| Assistant | 3+ | 15+ | Good |
| Infrastructure | 5+ | 20+ | Growing |

**Total PHPUnit:** ~775 tests across ~156 files

---

## Frontend Coverage

| Layer | Files | Tests | Notes |
|-------|------:|------:|-------|
| Vitest unit | ~25 | 128 | Utils, hooks, components |
| Playwright E2E | 18 | ~72 | Role smoke + journeys |

### Playwright Spec Inventory

| Spec | Role / area |
|------|-------------|
| `customer-journey.spec.ts` | Customer browse |
| `vendor-journey.spec.ts` | Vendor dashboard |
| `admin-journey.spec.ts` | Admin CMS |
| `provider-journey.spec.ts` | Provider |
| `b2b-journey.spec.ts` | B2B |
| `blog-journey.spec.ts` | Blog |
| `auth-isolation.spec.ts` | Session isolation |
| `responsive-smoke.spec.ts` | Layout |
| + 10 more smoke/navigation specs | Various |

---

## Integration / Infra Coverage

| Area | Tests | In CI | Status |
|------|------:|:-----:|--------|
| Redis runtime | 6 | No | EXISTS |
| MySQL EXPLAIN | 1 job | Yes | PARTIAL |
| Queue workers | 0 | No | **GAP** |
| Reverb WebSocket | 0 | No | **GAP** |
| Octane soak | 0 | No | **GAP** |
| Failure injection | 0 | No | **GAP** |

---

## k6 Coverage

| Script | In CI | Last run |
|--------|:-----:|----------|
| `analytics.js` | Yes | CI |
| `mixed-workload.js` | No | Phase 28.16 (rps10/25/50) |
| `catalog-read.js` | No | Phase 28.15 |
| `soak.js` / `soak15` | No | NOT RUN |
| `concurrent-probe` | No | Phase 28.15 |

---

## Coverage by Role

| Role | API | E2E | IDOR tests | DB integrity |
|------|:---:|:---:|:----------:|:------------:|
| Guest | ✓ | ✓ | partial | partial |
| Customer | ✓ | partial | ✓ | partial |
| Vendor | ✓ | ✓ | ✓ | partial |
| Provider | ✓ | ✓ | partial | partial |
| Affiliate | ✓ | — | partial | — |
| Admin | ✓ | ✓ | partial | partial |
| B2B (feature) | ✓ | ✓ | partial | partial |

---

## Critical Missing Coverage (P0)

1. Full customer checkout E2E (UI → payment → order DB)
2. Executable permission matrix (all roles × sensitive endpoints)
3. WebSocket connect + private channel + message delivery
4. Queue worker processing (real Redis queue)
5. Payment concurrent / replay webhook under load
6. Production-like E2E stack (MySQL + Redis + Octane)
