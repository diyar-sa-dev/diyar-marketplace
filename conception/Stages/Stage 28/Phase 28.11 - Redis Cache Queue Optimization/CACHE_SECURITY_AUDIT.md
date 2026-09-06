# Cache Security Audit

**Date:** 2026-08-27

---

## Isolation verification

| Resource | Key scoping | Test |
|----------|-------------|------|
| Admin permissions | Per UUID user + version | `CacheDeepAuditTest` PASS |
| Notifications unread | Per user UUID | Code review + unit tests |
| Chat unread/presence | Per user/conversation | Code review |
| Affiliate dashboard | Per profile ID | Code review |
| Analytics | scope + scopeId | Code review |
| Public catalog facets | No user data in key | Verified PUBLIC class |

---

## Critical fix (OPT-CACHE-010)

UUID admin users were previously keyed as `(int)0`. **Fixed** — string UUID in cache keys.

---

## Assistant / AI

- No response caching
- Rate limit: `assistant-chat` 30/min per IP
- KI-028-053: VERIFIED safe controls

---

## Authorization + cache

Cached authenticated data always includes tenant/user identifier in key or uses version invalidation tied to DB truth.

Cache is never the source of truth for: orders, payments, inventory, permissions (DB authoritative on miss).

---

## Verdict

**Cache Security: PASS**
