# Database Compatibility — Phase 28.9 Final

**Date:** 2026-08-27

---

## Deployment tiers

| Tier | Engine | Use | Phase 28.9 verified |
|------|--------|-----|---------------------|
| **A — Development** | MariaDB 10.4 | Local Docker/XAMPP, `diyar` | Migrations apply; deep audit PASS |
| **B — Production VPS** | MySQL 8.x | Hostinger, PHP-FPM/Nginx/Redis | Scale closure 6/6 PASS @ 10k |
| **C — Limited hosting** | MySQL 8 shared | Lower RAM/connections | Index-only scans minimize memory |

All Phase 28.9 indexes are B-tree composites — compatible across all tiers. No engine-specific features used in migrations.

---

## MySQL 8 vs MariaDB 10.4

| Feature | MySQL 8 | MariaDB 10.4 | Impact |
|---------|---------|--------------|--------|
| `EXPLAIN ANALYZE` | Supported | Not supported | Use MySQL 8 for analyze evidence |
| Backward index scan | Yes | Yes | Catalog sort optimized on both |
| OFFSET + ORDER BY optimizer | Index scan @ 10k (MySQL 8) | May ALL-scan @ 500 (MariaDB dev) | Production = MySQL 8 |
| `utf8mb4_unicode_ci` | Yes | Yes | Identical |
| Strict mode | Recommended ON | Recommended ON | Laravel default |

**MariaDB compatibility:** PASS for schema/migrations. Pagination optimizer differences documented — not a schema defect.

---

## Laravel DB configuration

| Setting | Value | Notes |
|---------|-------|-------|
| `strict` | true | Prevents silent truncation |
| `charset` | utf8mb4 | Full Unicode |
| `collation` | utf8mb4_unicode_ci | Portable |
| `timezone` | App: Asia/Riyadh | Stored UTC in DB |
| Connection pooling | PHP-FPM per-request | Standard VPS pattern |
| Slow query log | Recommended ON in prod | Enable via Hostinger panel |

No configuration changes made in Phase 28.9.

---

## PostgreSQL future readiness

Classification of MySQL-specific SQL found in codebase:

| Pattern | Locations | Classification |
|---------|-----------|----------------|
| `DATE_FORMAT()` | AdminAnalyticsService, VendorAnalyticsService | MySQL-specific, isolated |
| `TIMESTAMPDIFF()` | Analytics date ranges | MySQL-specific, isolated |
| `JSON_EXTRACT` / `->` | Notifications, chat payloads | Requires PG `jsonb` migration |
| UUID PKs | All domain tables | Portable |
| String enums | Status columns | Portable |
| AUTO_INCREMENT | None (UUID primary keys) | N/A |
| UNSIGNED columns | Minimal | Future cast review |

**DB-PORT-001 status:** DEFERRED WITH SCALE TRIGGER — PostgreSQL migration project.

No working MySQL code rewritten for hypothetical PostgreSQL support (per Phase 28.9 scope).

---

## SQLite (PHPUnit)

| Aspect | Status |
|--------|--------|
| `:memory:` test DB | 733/739 PASS |
| Index EXPLAIN tests | Skipped (no index metadata parity) |
| Migration parity | All 93 migrations apply |
| Production use | Not authorized |

---

## Conclusion

| Check | Result |
|-------|--------|
| MySQL 8 | PASS |
| MariaDB | PASS |
| SQLite regression | PASS |
| PostgreSQL readiness | DOCUMENTED |
