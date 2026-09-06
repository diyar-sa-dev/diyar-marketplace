# Phase 28.3 — API HTTP & Error Contracts

**Date:** 2026-08-27

---

## Response envelope (standard)

Successful API responses use:

```json
{
  "success": true,
  "data": { ... },
  "message": "optional"
}
```

Errors:

```json
{
  "success": false,
  "message": "...",
  "errors": { "field": ["..."] }
}
```

Verified in: `HealthEndpointTest`, auth tests, catalog tests, checkout tests.

---

## Status code semantics (observed)

| Situation | Status | Evidence |
|-----------|--------|----------|
| Success (read) | 200 | Widespread |
| Created (order, product) | 201 | `OrderCreationTest`, `ProductIdorTest` |
| Validation failure | 422 | Auth, registration, checkout |
| Unauthenticated | 401 | `OwnershipAuthorizationTest` |
| Forbidden (wrong owner/role) | 403 | `OrderAuthorizationTest`, `ProductIdorTest` |
| Not found | 404 | `HealthEndpointTest` unknown route |
| Rate limited | 429 | `RateLimitingTest` |
| Maintenance | 503 | `MarketplaceMaintenanceMiddlewareTest` |

---

## Content-Type

JSON APIs return `application/json` (asserted in health + auth tests).

---

## Security headers (health sample)

`HealthEndpointTest` verifies on `/api/v1/health`:

```text
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Permissions-Policy: present
```

---

## Pagination contract

List endpoints return paginated structure under `data.items` + metadata (verified catalog, orders, admin lists in Feature tests).

**Full pagination edge matrix** (beyond-last-page, max per_page): **PARTIAL** — not every list endpoint probed individually.

---

## Production error hiding

| Check | Result |
|-------|--------|
| Health hides `environment` in production | PASS — `HealthEndpointTest` |
| Unknown route JSON 404 | PASS — not HTML |
| 500 stack trace in JSON | **NOT VERIFIED** under forced exception |

---

## Inconsistencies recorded (not fixed)

| Observation | Category |
|-------------|----------|
| Some auth failures use 422 (`credentials`) vs 401 | Documented contract — intentional for login form |
| Admin vs marketplace error shapes | Largely aligned — minor message string differences |

---

## Contract gate

| Area | Result |
|------|--------|
| JSON envelope | **PASS** |
| Core status codes | **PASS** |
| Pagination all endpoints | **PARTIAL** |
| Error contract under 500 | **PARTIAL** |
