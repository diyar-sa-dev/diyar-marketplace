# Database Consolidation — Stage 28

**Source:** Phase 28.2  
**Architecture:** **MySQL 8.x production** · MariaDB 10.4 local · **PostgreSQL REJECTED**

---

## Proven

| Item | Evidence |
|------|----------|
| 93 migrations apply | migrate lifecycle PASS |
| MySQL 8.0.46 migrate + seed | `_db_mysql8_validate.json` PASS |
| FK / unique constraints | Integrity checks PASS |
| Catalog/checkout query bounds | Phase 28.2 query baseline |
| MariaDB ↔ MySQL 8 compatibility | Analytics SQL MySQL-specific — acceptable |

---

## Open issues

| ID | Sev | Issue | Blocker? |
|----|-----|-------|----------|
| KI-028-020 | P1 | Local root superuser | NO (local only) |
| KI-028-021 | P2 | Flaky shipping test | NO (not DB) |
| KI-028-022/030 | P2 | Full suite not MySQL 8 | CONDITIONAL |
| KI-028-023/005 | P2 | Shared schemas local | NO |
| KI-028-026 | P3 | DB outage not tested | NO |
| KI-028-027 | P3 | Script bug | NO |
| KI-028-028 | P3 | Analytics scale | OPT backlog |

---

## OPT-DB from performance (28.7)

| ID | Finding | Blocker? |
|----|---------|----------|
| OPT-DB-001 | products ALL + filesort @ 500 rows | **NO** — optimization |
| OPT-DB-002 | analytics_events @ 5k OK | Monitor at scale |
| OPT-DB-003 | Admin lists @ 10k not measured | TEST GAP |

---

## Verdict

```text
DATABASE READY: PASS WITH CONDITIONS
```

Conditions: KI-028-030 MySQL 8 full suite decision; local env hygiene (020/023).

PostgreSQL migration: **NOT REOPENED**.
