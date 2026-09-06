# Cache Transaction Consistency

---

## Problem

Invalidating cache **inside** an open DB transaction can cause:

1. **Rollback after invalidation** → unnecessary cache miss (acceptable)
2. **Invalidation before commit** → concurrent reader rebuilds stale data from DB, caches it, then transaction commits with new data → **stale cache until TTL** (critical)

---

## Audit findings (pass 2)

| Code path | Before | After |
|-----------|--------|-------|
| `ProductService::create/update` | Invalidated inside transaction | `invalidateSearchCachesAfterCommit()` |
| `ProductService::archive` | Immediate invalidation | afterCommit (no outer txn → immediate bump) |
| `AdminProductService::*` | Inside transaction | afterCommit |
| `AdminRolePermissionService::syncPermissions` | `forgetAll()` in transaction | `forgetAllAfterCommit()` |
| `AdminUserService::assignRole/revokeRole` | `forget($user)` in transaction | `forgetAfterCommit($user)` |
| Analytics invalidation | Via domain events | Events fired with `DB::afterCommit` from order/payment services — **OK** |

---

## Implementation

```php
// VersionedCache::bumpAfterCommit
if (DB::transactionLevel() > 0) {
    DB::afterCommit(fn () => self::bump($versionKey));
    return;
}
self::bump($versionKey);
```

---

## Tests

| Test | Result |
|------|--------|
| `CacheDeepAuditTest::test_catalog_version_bump_is_deferred_until_transaction_commits` | PASS |
| `CacheDeepAuditTest::test_catalog_version_bumps_after_successful_transaction` | PASS |

---

## Remaining acceptable patterns

- `EffectiveConfigService::invalidate` from settings listener — verify listener runs after save (sync, typically post-commit)
- Chat cache invalidation on message events — message persisted before event

---

## Verdict

**Transaction Consistency: PASS** (for catalog + admin permission paths verified and fixed)
