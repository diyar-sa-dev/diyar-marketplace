# Phase 28.6 — Security Test Strategy

**Date:** 2026-08-27  
**Commit:** `92638a9` (unchanged)

---

## Objective

Adversarial verification: can authenticated or unauthenticated actors access, modify, infer, upload, or trigger resources they should not?

**Rule:** TEST → ATTACK SAFELY → VERIFY → CLASSIFY → DOCUMENT — **no silent fixes, no commits**.

---

## Environment

| Constraint | Value |
|------------|-------|
| Target | Local PHPUnit (SQLite in-memory) |
| Production VPS | **NOT ATTACKED** |
| Destructive testing | Forbidden |
| Load/DoS | Forbidden (→ 28.7) |

---

## Test layers

| Layer | Scope |
|-------|-------|
| PHPUnit security suite | AuthZ, IDOR, uploads, webhooks, admin, chat, B2B |
| Source inspection | Middleware, policies, CORS, Sanctum, channels |
| Frontend inspection | XSS sinks, localStorage, route guards |
| E2E auth isolation | Phase 28.5 evidence (6/6 pass) |

---

## High-risk priority areas

1. Admin / marketplace isolation  
2. B2B tenant isolation  
3. Orders / payments / refunds  
4. Vendor / provider ownership  
5. Chat / realtime channels  
6. Uploads  
7. Webhooks  
8. Public assistant endpoint  
9. Coupons / loyalty / affiliate  

---

## Out of scope (this phase)

- Production penetration  
- Load testing  
- Credential stuffing  
- Malware uploads  
- Architecture changes  

---

## Evidence artifacts

```text
_security_phpunit_focused.txt
_security_phpunit_extended.txt
_security_route_inventory.json
```
