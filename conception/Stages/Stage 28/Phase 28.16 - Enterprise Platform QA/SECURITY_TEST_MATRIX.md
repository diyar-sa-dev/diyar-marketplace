# Security Test Matrix

**Source:** Routes middleware, policies, existing security tests, manual audit  
**Rule:** Do not invent permissions — derive from code

---

## Authorization Layers

```text
Request → SecurityHeaders → RateLimit → auth:sanctum → role middleware → Policy → Controller
```

---

## Role × Resource Matrix (from code)

| Resource / Action | Guest | Customer | Vendor | Provider | Affiliate | Admin |
|-------------------|:-----:|:--------:|:------:|:--------:|:---------:|:-----:|
| Public catalog | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cart (own) | session | ✓ | ✓* | ✓* | ✓* | ✓ |
| Own orders | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ |
| Other user orders | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Vendor products (own) | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ |
| Vendor products (other) | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Provider services (own) | ✗ | ✗ | ✗ | ✓ | ✗ | ✓ |
| Admin settings | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| B2B company (own) | ✗ | ✓** | ✓** | ✓** | ✗ | ✓ |
| B2B company (other) | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Affiliate dashboard | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Payment webhooks | ✗ | ✗ | ✗ | ✗ | ✗ | signature |
| Chat (own thread) | ✗ | ✓ | ✓ | ✓ | ✗ | ✓ |

\* Vendors/providers may have customer accounts for purchasing  
\** B2B is company-scoped, not a global role

---

## Automated Security Tests (existing)

| Category | Test location | Status |
|----------|---------------|--------|
| Rate limiting | `RateLimitingTest.php` | ✓ |
| Auth isolation | `auth-isolation.spec.ts` | ✓ |
| File upload validation | `FileUploadSecurityTest.php` | ✓ |
| IDOR vendor orders | `VendorOrderTest.php` | ✓ |
| Payment webhook signature | `PaymentWebhookTest.php` | ✓ |
| CSRF (API token) | Sanctum bearer | ✓ (stateless API) |
| XSS (stored) | partial API | partial |
| Mass assignment | FormRequest tests | partial |
| Open redirect | — | **GAP** |
| SSRF | — | **GAP** |
| CSP headers | `SecurityHeaders.php` | manual |

---

## IDOR Test Requirements

| Scenario | Automated | Priority |
|----------|:---------:|----------|
| Customer → other customer order | ✓ API | P0 |
| Vendor A → Vendor B product | ✓ API | P0 |
| Vendor A → Vendor B order | ✓ API | P0 |
| Provider A → Provider B booking | partial | P0 |
| Company A user → Company B RFQ | partial | P0 |
| Affiliate → admin payout | partial | P1 |
| Guest → authenticated endpoint | ✓ | P0 |

---

## High-Traffic Security (controlled local)

| Attack vector | Protection | Test |
|---------------|------------|------|
| Login brute force | Rate limit | ✓ API |
| Search abuse | Rate limit | partial |
| Large pagination | PaginationBounds | ✓ |
| Cart abuse | Rate limit | partial |
| Webhook replay | Idempotency key | ✓ |
| Large payload | nginx/client max | manual |
| Assistant abuse | Rate limit | ✓ |

---

## Frontend Security

| Check | Status |
|-------|--------|
| dangerouslySetInnerHTML audit | manual needed |
| Token in localStorage | Sanctum cookie/token pattern |
| Hidden routes without server guard | **verify** |
| Admin UI client-side only guard | **must fail server-side** |

---

## Regression Suite (target)

```text
backend/tests/Feature/Security/PermissionMatrixTest.php  (TO CREATE)
frontend/e2e/security-boundaries.spec.ts                 (TO CREATE)
```

Derive endpoint list from:
- `routes/api.php`
- `bootstrap/app.php` middleware groups
- `app/Policies/*.php`
