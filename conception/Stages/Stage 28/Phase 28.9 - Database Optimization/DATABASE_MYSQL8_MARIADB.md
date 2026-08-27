# MySQL 8 + MariaDB Compatibility — Phase 28.9

---

## Production vs development

| Environment | Engine | Version | Role |
|-------------|--------|---------|------|
| **Production** | MySQL | 8.x | **Primary** — all optimizations verified here first |
| **Development** | MariaDB | 10.4.x (XAMPP) | Secondary — standard DDL must work |

---

## OPT-DB-001 compatibility

```sql
INDEX products_status_created_at_index (status, created_at)
```

| Engine | Status |
|--------|--------|
| MySQL 8.0.46 | **Verified** — EXPLAIN range + backward scan |
| MariaDB 10.4 | **Expected PASS** — standard BTREE secondary index; not re-run in 28.9 on XAMPP |

---

## Known engine differences (documented, not blocking)

| Area | MySQL 8 | MariaDB 10.4 | Mitigation |
|------|---------|--------------|------------|
| EXPLAIN ANALYZE | Full support | Varies by version | Use MySQL for perf proof |
| JSON functions | MySQL 8 JSON | Compatible subset | Laravel casts |
| `utf8mb4` | Standard | Standard | Migrations use utf8mb4 |
| Online DDL | InnoDB ALGORITHM=INPLACE | Similar | Single index add — low lock |

---

## Phase 28.2 baseline

- Migration lifecycle: PASS on MySQL 8 + MariaDB (Phase 28.2).
- 209 FK integrity: PASS.
- No new FK or column type changes in 28.9 — compatibility risk **low**.

---

## Testing matrix

| Test | MySQL 8 | MariaDB | SQLite (CI) |
|------|---------|---------|-------------|
| Full PHPUnit 732 | NOT VERIFIED full run 28.9 | NOT VERIFIED | **Expected PASS** |
| ProductListIndexTest | Script-verified | Skip | Skip |
| Migration up/down | Applied on MySQL 8 staging | NOT VERIFIED | In-memory migrate via RefreshDatabase |

---

## Recommendation

Add MySQL 8 CI job (OPT-INFRA-003) for engine parity — tracked in optimization backlog, not completed in 28.9.
