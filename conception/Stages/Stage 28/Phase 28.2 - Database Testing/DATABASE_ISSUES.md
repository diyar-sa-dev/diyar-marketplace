# Phase 28.2 — Database Issues Register

**Date:** 2026-08-27  
**Commit:** `92638a9`

---

## P1 — Major production blocker / high risk

### KI-028-020 — Local DB user has global superuser privileges

| Field | Value |
|-------|-------|
| **Area** | Security / isolation |
| **Severity** | P1 |
| **Category** | ENVIRONMENT GAP |
| **Environment** | Local XAMPP MariaDB |
| **Reproducibility** | Always |
| **Evidence** | `SHOW GRANTS`: `ALL PRIVILEGES ON *.*` for `root@localhost` |
| **Expected** | App user scoped to `diyar.*` only |
| **Actual** | Full server access; can read/write all schemas |
| **Impact** | Misconfiguration could damage unrelated DBs; not representative of production least-privilege |
| **Root cause** | Default XAMPP root setup |
| **Status** | OPEN |
| **Action** | Phase 28.14 — create scoped dev user; document production grants |

---

## P2 — Significant

### KI-028-021 — ShippingRulePrecedenceTest is flaky (not a DB defect)

| Field | Value |
|-------|-------|
| **Area** | Unit test / shipping weight |
| **Severity** | P2 |
| **Category** | TEST DEFECT |
| **Environment** | PHPUnit SQLite |
| **Reproducibility** | Intermittent (~when Product factory sets random L×W×H) |
| **Evidence** | Phase 28.1: error *Cart weight exceeds the maximum supported limit.*; Phase 28.2: 5/5 PASS when dimensions null; failure when volumetric weight > 1000kg |
| **Expected** | Test always validates vendor rule precedence |
| **Actual** | Random factory dimensions trigger `ShippingWeightCalculator` max weight exception before rule resolution |
| **Impact** | CI/backend job intermittent failure; misclassified as shipping bug |
| **Root cause** | Test sets `weight_kg=1.0` but not `width/height/depth=null`; factory may set up to 300cm each → volumetric weight thousands of kg |
| **Status** | OPEN |
| **Action** | Phase 28.5 — fix fixture (null dimensions or cap sizes); **not a database defect** |

### KI-028-022 — PHPUnit default suite does not run on MySQL/MariaDB

| Field | Value |
|-------|-------|
| **Area** | Test coverage |
| **Severity** | P2 |
| **Category** | TEST GAP |
| **Environment** | CI + local PHPUnit |
| **Evidence** | `phpunit.xml`: `DB_CONNECTION=sqlite`, `:memory:` |
| **Impact** | Engine-specific SQL/constraint behavior may differ in production MySQL 8 |
| **Status** | OPEN (extends KI-028-002 from Phase 28.1) |
| **Action** | Add MySQL 8 job or run messaging-integration on every PR |

### KI-028-023 — Shared MariaDB server hosts unrelated schemas

| Field | Value |
|-------|-------|
| **Area** | Environment isolation |
| **Severity** | P2 |
| **Category** | ENVIRONMENT GAP |
| **Environment** | Local XAMPP |
| **Evidence** | `_db_environment.json`: 6 unrelated schemas; foreign schema readable |
| **Impact** | Baseline noise; risk if `DB_DATABASE` misconfigured |
| **Status** | OPEN (extends KI-028-005) |
| **Action** | Phase 28.14 |

### KI-028-024 — MySQL 8 full application test suite NOT VERIFIED

| Field | Value |
|-------|-------|
| **Area** | Compatibility |
| **Severity** | P2 |
| **Category** | NOT VERIFIED |
| **Environment** | MySQL 8.0.46 Docker |
| **Evidence** | migrate+seed PASS; 732 PHPUnit tests NOT run against MySQL 8 |
| **Impact** | Unknown engine-specific runtime failures before production |
| **Status** | OPEN |
| **Action** | Run PHPUnit with `DB_*` → staging MySQL before prod deploy |

---

## P3 — Minor

### KI-028-025 — Analytics SQL uses MySQL-specific date functions

| Field | Value |
|-------|-------|
| **Area** | Compatibility |
| **Severity** | P3 |
| **Category** | COMPATIBILITY FINDING |
| **Evidence** | `AdminAnalyticsService`: `DATE_FORMAT`, `TIMESTAMPDIFF`, `STR_TO_DATE` |
| **Impact** | Portable between MariaDB 10.4 and MySQL 8 — **NOT PostgreSQL** |
| **Status** | DOCUMENTED |
| **Action** | Execute analytics on MySQL 8 with seed in Phase 28.3/28.7 |

### KI-028-026 — DB failure / readiness degradation NOT TESTED

| Field | Value |
|-------|-------|
| **Area** | Resilience |
| **Severity** | P3 |
| **Category** | NOT VERIFIED |
| **Evidence** | No simulated outage test in Phase 28.2 |
| **Status** | OPEN |
| **Action** | Phase 28.5 failure injection |

### KI-028-027 — Integrity script order_items orphan check used wrong column

| Field | Value |
|-------|-------|
| **Area** | Instrumentation |
| **Severity** | P3 |
| **Category** | TEST DEFECT (diagnostic script) |
| **Evidence** | Script joined on `order_id`; schema uses `vendor_order_id` |
| **Status** | OPEN |
| **Action** | Fix script in future phase if re-run needed |

### KI-028-028 — Analytics query performance NOT measured at scale

| Field | Value |
|-------|-------|
| **Area** | Performance |
| **Severity** | P3 |
| **Category** | OPTIMIZATION CANDIDATE |
| **Evidence** | Heavy `selectRaw` in analytics services; no EXPLAIN captured |
| **Status** | BACKLOG |
| **Action** | Phase 28.7 profiling |

---

## P4 — Informational

### KI-028-029 — Dev database size very small

| Field | Value |
|-------|-------|
| **Area** | Baseline |
| **Severity** | P4 |
| **Category** | DOCUMENTATION |
| **Evidence** | Largest table ~0.19 MB |
| **Impact** | Performance baselines not representative of production volume |
| **Status** | DOCUMENTED |

### KI-028-030 — Phase 28.1 shipping failure reclassified

| Field | Value |
|-------|-------|
| **Area** | KI-028-001 triage |
| **Severity** | Reclassified P1 → P2 TEST DEFECT |
| **Category** | TEST DEFECT (was CONFIRMED BUG) |
| **Evidence** | Not DB-related; flaky factory dimensions |
| **Status** | Superseded by KI-028-021 |

---

## Optimization backlog (NOT implemented)

| ID | Description | Phase |
|----|-------------|-------|
| OPT-DB-001 | Profile analytics endpoints query count | 28.7 |
| OPT-DB-002 | EXPLAIN cohort query on MySQL 8 | 28.7 |
| OPT-DB-003 | Index review after load test evidence | 28.8+ |

---

## Issue counts

| Severity | Count |
|----------|-------|
| P1 | 1 |
| P2 | 4 |
| P3 | 4 |
| P4 | 2 |

---

## Issues explicitly NOT raised

| Topic | Reason |
|-------|--------|
| Missing migrations | 93/93 applied — PASS |
| PostgreSQL incompatibility | Rejected by architecture decision |
| Production DB corruption | No evidence |
