# Database Schema Cleanup — Phase 28.9

**Date:** 2026-08-27  
**Policy:** 14-point proof required before any DROP.

---

## Result

| Action | Count |
|--------|-------|
| Tables investigated | 123 |
| Tables removed | **0** |
| Migrations created for DROP | **0** |
| Tables documented as SUSPECT | **0** |

---

## Investigation summary

1. Cross-referenced Phase 28.2 schema inventory (123 tables, 209 FKs).
2. Mapped Eloquent models in `app/Models` to tables.
3. Grep for raw SQL table names — no orphan references found for production tables.
4. Laravel infrastructure tables (`jobs`, `cache`, `sessions`, `migrations`) — **required**, retained.
5. Audit tables (`admin_audit_logs`, `payment_webhook_events`) — **retained** for compliance/debug.

---

## Candidates considered, not removed

| Table / area | Why retained |
|--------------|--------------|
| `wishlist_items` / wishlists | Active customer feature |
| `affiliate_attributions` | Affiliate attribution workflow |
| `search_query_events` | Analytics — low row count |
| Duplicate-looking indexes | No duplicate proven harmful |

---

## Forward policy

If a table appears unused in future:

1. Document in this file with evidence checklist.
2. Add deprecation comment in model/migration notes.
3. Forward migration only after full regression on MySQL 8 + MariaDB 10.4.

**Never modify historical migrations already applied in production.**
