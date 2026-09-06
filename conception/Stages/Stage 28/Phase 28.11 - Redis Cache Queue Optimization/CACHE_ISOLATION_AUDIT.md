# Cache Isolation Audit

---

## Critical fix (pass 2): OPT-CACHE-010

**Bug:** `CacheKeys::adminPermissions((int) $user->id, ...)`  
**Impact:** UUID strings cast to `(int)` → `0` for all users  
**Result:** All admin users shared one permission cache entry — **cross-user data leak risk**

**Fix:**
```php
CacheKeys::adminPermissions((string) $user->id, $version)
// diyar:admin:permissions:v4:{uuid}:{version}
```

**Test:** `CacheDeepAuditTest::test_admin_permission_cache_keys_are_isolated_per_user` — PASS

---

## User-scoped caches (verified UUID-safe)

| Service | Key includes |
|---------|--------------|
| `NotificationUnreadCounterService` | `$user->id` (string) |
| `ChatUnreadCounterService` | `$userId` string param |
| `ChatPresenceService` | `$user->id` |
| `AffiliateAttributionService` | user/session scoped |
| `AffiliateDashboardService` | `$profile->id` |

---

## Tenant-scoped caches

| Service | Isolation |
|---------|-----------|
| `AnalyticsCache` | `scope` + `scopeId` (vendor/provider/platform) |
| `AffiliateDashboardService` | `affiliate_profile_id` |
| Vendor analytics | `vendor_account_id` in scope |

---

## Public caches (must NOT contain user data)

| Cache | User param in key? |
|-------|-------------------|
| Catalog facets | No — filter hash only |
| Catalog suggestions | No |
| Categories list | No |

Catalog **product lists** are not Redis-cached at API layer (DB + indexes from 28.9).

---

## Assistant / AI

- No response caching (verified)
- Rate limit per IP (`assistant-chat`)

---

## Verdict

**Cache Isolation: PASS** (after UUID admin permission fix)

Regression test required in CI: `CacheDeepAuditTest`
