# Database Scalability — Phase 28.9

---

## Tier 1 — Limited VPS (1–2 CPU, 2–4 GB RAM)

| Concern | Mitigation in place / 28.9 |
|---------|---------------------------|
| Connection count | PHP-FPM per-request connections — no persistent DB |
| Large scans | OPT-DB-001 reduces catalog scan cost |
| Result set size | Pagination on list endpoints |
| Index memory | +1 products index — negligible vs buffer pool |

---

## Tier 2 — Hostinger VPS (production target)

| Component | Design |
|-----------|--------|
| MySQL 8 | Primary engine — OPT-DB-001 verified |
| PHP-FPM + Nginx | Standard request lifecycle |
| Redis | Cache/queue (not DB — see 28.11) |
| Catalog growth | Index supports 10k+ active products better than full scan |

**Expected production benefit:** Predictable catalog list latency as product count grows.

---

## Tier 3 — Larger VPS

| Capability | Readiness |
|------------|-----------|
| Higher concurrency | Indexes + pagination adequate short-term |
| 100k+ analytics events | Monitor OPT-DB-002; may need partitioning later |
| More queue workers | Independent of schema — 28.11 |

---

## Tier 4 — Future (NOT implemented)

| Option | When |
|--------|------|
| Read replicas | Traffic exceeds single MySQL capacity |
| Domain DB split | Organizational scale — map in DATABASE_TABLE_AUDIT |
| PostgreSQL | Business decision — not 28.9 |
| Dedicated search (Elasticsearch/etc.) | Catalog search complexity |

**28.9 ensures** monolithic schema remains logically domain-oriented for future decomposition without forcing it now.

---

## Connection efficiency

Reviewed `config/database.php`:

- No persistent connections enabled.
- Queue workers use standard Laravel reconnect behavior.
- Octane-specific concerns deferred to 28.14 (production is PHP-FPM).
