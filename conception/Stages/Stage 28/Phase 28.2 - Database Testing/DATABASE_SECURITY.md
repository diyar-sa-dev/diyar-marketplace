# Phase 28.2 — Database Security & Isolation

**Date:** 2026-08-27

---

## Application database scope

| Setting | Value |
|---------|-------|
| Connection name | `mysql` (default in dev) |
| Database | `diyar` |
| Host | 127.0.0.1:3306 |
| `SELECT DATABASE()` | `diyar` — **matches config** |

Laravel migrations and queries operate on the **configured database** only. No application migration references foreign schemas.

---

## Isolation test results

**Command:** `php scripts/stage28-db-environment.php`

| Check | Result |
|-------|--------|
| Current database matches config | **PASS** |
| Tables in `diyar` schema | **123** (scoped correctly) |
| Unrelated schemas on same server | **6** (`cyber`, `cybercafe_db`, `hospital_stock`, `phpmyadmin`, `test`, `transport`) |
| Can read foreign schema metadata | **YES** — `hospital_stock` (11 tables), `cybercafe_db` (57 tables) |
| Cross-schema SQL in migrations | **0 files** |

### `migrate:fresh` safety

| Question | Answer |
|----------|--------|
| Does Laravel migrate affect other schemas? | **NO** — scoped to `DB_DATABASE` |
| Risk on shared XAMPP instance? | **HIGH** if wrong `DB_DATABASE` in `.env` |
| Risk with current config? | Operations target `diyar` only |

**Recommendation:** Use dedicated MySQL user limited to `diyar` schema only (KI-028-020).

---

## Database user privileges

**Current user (local dev):** `root@localhost`

| Grant | Present |
|-------|---------|
| ALL PRIVILEGES ON `*.*` | **YES** |
| GRANT OPTION | YES |

### Required privilege set (production application user)

| Privilege | Needed for app runtime |
|-----------|------------------------|
| SELECT | YES |
| INSERT | YES |
| UPDATE | YES |
| DELETE | YES |
| CREATE / ALTER / DROP | **NO** (migration user only) |
| INDEX | NO (migration user) |
| REFERENCES | Implicit via FK |

### Recommended separation

| User | Purpose | Privileges |
|------|---------|------------|
| `diyar_app` | Runtime API/workers | SELECT, INSERT, UPDATE, DELETE on `diyar.*` |
| `diyar_migrate` | Deploy/migrations | DDL on `diyar.*` |
| `root` | Admin only | Not for application |

**Status:** Local dev uses **excessive privileges** — ENVIRONMENT GAP, not application defect.

---

## SQL injection surface

| Area | Mitigation |
|------|------------|
| Eloquent ORM | Parameterized queries default |
| `selectRaw` / `whereRaw` | Present in analytics — bindings used where inspected |
| User input in raw SQL | **NOT exhaustively audited** — Phase 28.6 |

---

## Data exposure risks

| Risk | Severity | Evidence |
|------|----------|----------|
| Shared server schema visibility | P2 | root can enumerate all DBs |
| `.env` credentials in repo | P0 if committed | `.env` gitignored — PASS |
| phpMyAdmin on same instance | P3 | `phpmyadmin` schema present |

---

## Security gate

```text
PARTIAL
```

Application queries are scoped correctly. **Environment isolation and least-privilege NOT met** on local dev workstation.

---

## Actions deferred (not implemented in 28.2)

1. Create `diyar_app` user with schema-scoped grants.
2. Document Hostinger production user setup.
3. Add CI check that `.env.example` documents separate migration credentials.
