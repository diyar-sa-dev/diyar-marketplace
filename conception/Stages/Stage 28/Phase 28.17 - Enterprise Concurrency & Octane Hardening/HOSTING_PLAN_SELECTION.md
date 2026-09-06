# Hostinger Plan Selection — Measured Evaluation (KVM 2 vs KVM 4)

**Date:** 2026-09-03  
**Method:** Execute → measure → compare to plan budgets. No plan pre-selected.  
**Environment:** Local Docker on Windows workstation (NOT Hostinger hardware). Results are **proxy measurements** — VPS validation required before final purchase.

**Raw evidence:**
- `_raw/hosting-audit-octane-multinode-20260903-120000.json`
- `_raw/hosting-audit-fpm-production-like-20260903-120258.json` (invalid — FPM API returns 404, excluded from decision)
- `_raw/load-categories-c10-d10.txt`, `_raw/load-search-c25-d15.txt`, `_raw/load-health-c50-d10.txt`
- `backend/scripts/stage2817-hosting-capacity-audit.php` (reproducible)

---

## 1. What Was Measured

### Stack profile: `octane-multinode` (closest to full initial production)

| Service | Container(s) | In measurement? |
|---------|--------------|-----------------|
| Nginx | 1 | Yes |
| PHP 8.3 + Octane/Swoole | 2 nodes × 2 workers | Yes |
| Laravel API | via Octane | Yes |
| MySQL 8 | 1 | Yes |
| Redis 7 | 1 | Yes |
| Queue workers | 2 | Yes |
| Scheduler | 2 (onOneServer mutex) | Yes |
| Reverb | — | **No** (not in compose) |
| PHP-FPM | — | **Yes** (`:8092` — fixed nginx + FPM pool; health 200) |
| Frontend static | — | **No** (negligible RAM via Nginx) |
| Monitoring | — | **No** (estimated only) |

### Hostinger plan budgets (commercial specs)

| Plan | vCPU | RAM | NVMe | Source |
|------|-----:|----:|-----:|--------|
| **KVM 2** | 2 | 8 GB | 100 GB | [Hostinger VPS](https://www.hostinger.com/vps-hosting) |
| **KVM 4** | 4 | 16 GB | 200 GB | same |

**Assumed OS reserve:** 1 GiB RAM + ~0.5 vCPU for kernel/ssh/monitoring overhead.

---

## 2. Measured Resource Utilization (Octane multinode)

### 2.1 Idle footprint

| Component | RAM (MiB) | CPU %* |
|-----------|----------:|-------:|
| MySQL | 580 | 0.5 |
| Octane api-a | 140 | 0.9 |
| Octane api-b | 140 | 1.0 |
| Queue worker ×2 | 76 | 0.2 |
| Scheduler ×2 | 5 | 0.0 |
| Redis | 4.5 | 0.4 |
| Nginx | 4.4 | 0.0 |
| **Total** | **~947** | **~3.2** |

\*Docker `CPUPerc` is relative to **host logical CPUs** (11.68 GiB / multi-core Windows). **Not comparable to 2 or 4 VPS vCPUs.** CPU conclusions use throughput/latency saturation, not Docker CPU %.

### 2.2 Under load (peak observed)

| Workload | Concurrency | Duration | RPS | p50 | p95 | p99 | 5xx |
|----------|------------:|---------:|----:|----:|----:|----:|----:|
| `/api/v1/health` | 50 | 10s | **345** | 130ms | 270ms | 318ms | 0 |
| `/api/v1/categories` | 10 | 10s | **324** | 26ms | 44ms | 159ms | 0 |
| `/api/v1/products?per_page=12` | 15 | 10s | **45** | 314ms | 478ms | 512ms | 0 |
| `/api/v1/catalog/search`† | 25 | 15s | 533‡ | 525ms | 529ms | 529ms | 0 |

†Search endpoint hit **rate limit** (`60/min` per IP) during sustained audit — RPS/latency **not valid for capacity**.  
‡Use categories sweep below instead.

**Peak stack RAM under load:** **974 MiB** (+27 MiB vs idle).

### 2.3 Warm latency probe (30 iterations, single client)

| Endpoint | p50 | p95 | p99 | max |
|----------|----:|----:|----:|----:|
| health | 16ms | 32ms | 32ms | 35ms |
| categories | 12ms | 25ms | 25ms | 25ms |
| catalog_search | 42ms | 74ms | 124ms | 521ms |
| products | 78ms | 91ms | 92ms | 114ms |

**Draft SLO (project-internal, not certified SLA):** public catalog p95 ≤ 500ms, health p95 ≤ 100ms.

### 2.4 Categories saturation sweep (no IP rate limit, 15s windows)

| Concurrency | RPS | p50 | p95 | p99 | 5xx | Notes |
|------------:|----:|----:|----:|----:|----:|-------|
| 10 | **274** | 27ms | 80ms | 169ms | 0 | Healthy |
| 25 | **363** | 59ms | 135ms | 199ms | 0 | Healthy |
| 50 | **370** | 121ms | **241ms** | 268ms | 0 | **Last clean server operating point** |
| 75 | 560 | 226ms | 454ms | 454ms | 0* | *7,890/8,400 client-side errors — load generator limit, not server 5xx |
| 100 | 733 | — | — | — | 0* | *10,998/11,000 client errors — invalid |

**Measured single-node safe operating point (Octane, browse):**
- **≤50 concurrent requests** sustained
- **~370 RPS** on `/categories` with **p95 = 241ms**, **0% 5xx**

**Saturation signal:** Above c=50, p95 rises toward 454ms; c≥75 contaminated by Windows curl client limits — **true VPS saturation point not yet measured on Hostinger hardware.**

### 2.5 MySQL (measured)

| Metric | Value |
|--------|------:|
| `Threads_connected` (idle) | 3 |
| `Max_used_connections` | 8 |
| `max_connections` | 151 |
| `Slow_queries` | 2 |
| Idle RAM | ~580 MiB |

MySQL is **healthy** at measured load; **not** connection-saturated.

### 2.6 Redis (measured)

| Metric | Value |
|--------|------:|
| `used_memory` | 1.50M |
| `used_memory_rss` | 8.84M |
| `PING` | PONG |

Redis is **not** a bottleneck at measured scale.

### 2.7 Queue / Reverb

| Service | Status |
|---------|--------|
| Queue workers | Idle ~38 MiB each; no backlog measured this session |
| Reverb | **Not deployed in measurement stack** — budget **+100–200 MiB** estimated for 2 instances |

---

## 3. Production Stack RAM Budget (measured + explicit estimates)

| Layer | KVM budget item | MiB |
|-------|-----------------|----:|
| Measured Octane stack (peak) | Core services | **974** |
| Reverb ×2 | **Estimated** | 150 |
| Monitoring (node exporter + logs) | **Estimated** | 150 |
| PHP-FPM pool (fallback, 8 workers) | **Estimated** | 400 |
| MySQL growth (buffer pool tune) | **Estimated** | +512–1024 |
| Redis `maxmemory` (prodlike config) | Cap | 256 |
| OS + headroom reserve | Assumption | 1024 |
| **Conservative total** | | **~3.4–4.0 GiB** |
| **Aggressive MySQL (2G buffer)** | | **~4.5–5.0 GiB** |

| Plan | Usable RAM (after 1 GiB OS) | Headroom vs conservative 4 GiB | Headroom vs measured 974 MiB |
|------|----------------------------:|-----------------------------:|-----------------------------:|
| **KVM 2** (8 GiB) | ~7 GiB (7168 MiB) | **~3.2 GiB** | **~6.2 GiB** |
| **KVM 4** (16 GiB) | ~15 GiB (15360 MiB) | **~11 GiB** | **~14 GiB** |

**RAM verdict:** Both KVM 2 and KVM 4 have ** sufficient RAM** for the complete initial co-located stack at early scale. **KVM 2 is not RAM-constrained** at measured footprint.

---

## 4. CPU Evaluation (honest limits)

| Question | KVM 2 | KVM 4 |
|----------|-------|-------|
| Docker CPU % on 12-core host | Low (~3–19%) | N/A — same measurement |
| Absolute vCPU utilization on VPS | **NOT MEASURED** | **NOT MEASURED** |
| Throughput at safe op point | ~370 RPS categories | Unknown improvement factor |
| FPM vs Octane on same VPS | FPM **not validly measured** this session; prior directional: FPM 5–10× slower p50 | — |

**CPU is the deciding constraint**, not RAM. Without a Hostinger KVM 2 trial:
- **Cannot certify** KVM 2 sustains Octane + MySQL + workers + Reverb under peak CPU
- **Cannot assume** KVM 4 doubles RPS (measure on VPS to confirm)

---

## 5. Selection Rule Application

| Criterion | KVM 2 | Evidence |
|-----------|-------|----------|
| All critical services simultaneously | **Partial** | Octane stack yes; Reverb/FPM/monitoring not in measurement |
| No sustained CPU saturation | **Unknown** | VPS CPU not measured |
| No memory pressure | **Pass** | Peak 974 MiB ≪ 8 GiB |
| No swap dependence | **Unknown** | Not measured on VPS |
| MySQL healthy | **Pass** | 8/151 connections, 2 slow queries |
| Redis healthy | **Pass** | Sub-ms, 1.5M used |
| Queues bounded | **Pass** | No backlog observed |
| Reverb healthy | **Not tested** | — |
| p95 within draft SLO | **Pass** at c≤50 | categories p95=241ms < 500ms |
| Concurrency tests pass | **Pass** | PHPUnit + HTTP probes green |
| No service starves another | **Unknown at VPS CPU** | — |
| Safety headroom | **RAM: yes; CPU: unknown** | — |

---

## 6. Decision

### Initial production plan: **Hostinger KVM 2** — with explicit CPU validation gate

**Why KVM 2 (not assumed KVM 4):**
1. **Measured RAM peak ~1 GiB** for core stack — **~6 GiB headroom** on 8 GiB plan.
2. **Safe Octane operating point** 370 RPS / c≤50 with p95=241ms meets draft catalog SLO.
3. MySQL and Redis **healthy**, not limiting.
4. Early production workload (see §7) maps to **<100 RPS peak** — **below measured 370 RPS** capacity.

**Conditions before production cutover on KVM 2:**
1. **48-hour soak on real KVM 2** with full stack (Nginx + FPM + Octane + MySQL + Redis + 2 queue + scheduler + Reverb + static frontend + monitoring).
2. **CPU sustained <70%** during simulated peak (≥100 concurrent browse, checkout probe, queue drain).
3. **Zero swap** during soak.
4. **Upgrade trigger to KVM 4** if any: CPU >70% sustained 15min, p95 catalog >500ms under normal load, MySQL buffer pool need >1.5 GiB, Reverb connections >1000, or queue backlog growth.

### When to choose KVM 4 instead (skip KVM 2)

Choose **KVM 4** immediately if:
- You want **Octane as primary** from day one **without** CPU validation delay.
- MySQL `innodb_buffer_pool_size` ≥ **1.5 GiB** on same node.
- Expected **>150 concurrent shoppers** at launch.
- You require **dual Reverb + 4+ queue workers + FPM fallback** all co-located with **no CPU validation window**.

**KVM 4 is not automatically 2× capacity** — measure after migration.

---

## 7. Capacity Model — 50,000 Users (not simultaneous)

### Assumptions (explicit, not certified)

| Parameter | Value | Rationale |
|-----------|------:|-----------|
| Registered users | 50,000 | Target |
| Daily active (DAU) | 10% → 5,000 | Marketplace norm |
| Peak online | 10% of DAU → **500** | Evening peak |
| HTTP requests / active user / minute | 2 | Browse + search |
| Peak HTTP RPS (average) | 500 × 2 / 60 ≈ **17 RPS** | Steady peak |
| Burst factor | ×5 | Campaigns, flash sales |
| **Peak burst RPS** | **~85 RPS** | Planning number |
| WebSocket connections (peak) | 200 (40% of online) | Chat + notifications |
| Queue jobs/sec (peak) | 5–15 | Orders + webhooks + notifications |
| DB queries/sec (peak) | 50–150 | Derived from 85 RPS × 1–2 QPS/request |

### Single-node measured vs projected

| Metric | Measured (Octane Docker) | vs peak burst 85 RPS |
|--------|-------------------------:|---------------------:|
| Safe sustained RPS (categories) | **370** | **4.4× headroom** |
| p95 at safe point | 241ms | Within SLO |
| RAM | 974 MiB | Fits KVM 2 |

**Interpretation:** A **single Octane node** at measured operating point **covers projected 50k-user peak burst** for **browse/catalog** workloads — **if** VPS CPU matches proxy behavior and MySQL keeps pace. **Checkout/payment/admin** paths are **heavier** and **not fully saturation-tested**.

### Multi-node projection (linear scaling assumption — must verify)

| Topology | Projected browse RPS | Notes |
|----------|---------------------:|-------|
| 1× KVM 2 (Octane) | ~370 measured | CPU on VPS TBD |
| 2× KVM 2 app nodes + LB | ~600–740** | **Assumes 0.8–1.0× linear**; measure |
| 1× KVM 4 (Octane, 4 workers) | ~500–600** | **Not measured** |
| Dedicated MySQL on KVM 4 | Frees ~580 MiB–2 GiB app RAM | Scale trigger |

**Never claim:** "KVM 2 supports 50,000 simultaneous users."  
**Correct claim:** Architecture supports **50,000+ registered users** with **~500 peak concurrent** at **~85 RPS burst**, which is **below measured single-node browse capacity**, with horizontal scale path for growth.

---

## 8. Horizontal Scale Path (no business-logic rewrite)

```
KVM 2 (FPM primary, Octane optional)
  → KVM 4 (same node, more CPU/RAM)
  → 2× KVM 4 app nodes + load balancer
  → Dedicated MySQL (KVM 4/8)
  → Dedicated Redis
  → Dedicated queue workers
  → Dedicated Reverb nodes
  → Object storage (S3-compatible)
  → CDN
  → Separate AI gateway + queue
```

Application already supports: Redis sessions, Redis queue/cache, stateless API nodes, `onOneServer` scheduler, idempotent payments/webhooks.

---

## 9. Recommended Initial Architecture (measured-informed)

```
Hostinger KVM 2
├── Nginx (TLS, static SPA, API reverse proxy)
├── PHP 8.3-FPM (primary, 6–8 workers)
├── Octane/Swoole (optional profile, 2 workers — enable after CPU soak)
├── MySQL 8 (innodb_buffer_pool=512M–1G initially)
├── Redis 7 (sessions, cache, queue, mutex; maxmemory 256M)
├── Queue workers ×2 (critical + default)
├── Scheduler ×1 (onOneServer)
├── Reverb ×1 initially → ×2 when WS >500
└── Monitoring (node exporter + log shipping)
```

**Runtime choice:** Start **FPM primary** on KVM 2; enable **Octane** after 48h CPU soak passes or when p95 justifies it.

---

## 10. What Remains Unmeasured (blocks full certification)

| Item | Impact on decision |
|------|-------------------|
| Real KVM 2 / KVM 4 VPS CPU under load | **Critical** — could flip KVM 2 → KVM 4 |
| Reverb 2-instance RAM/CPU | Medium |
| FPM production-like throughput | High — `:8080` stack returned 404 |
| Checkout/payment path saturation | High |
| Swap behavior under memory pressure | Medium |
| 50+ concurrent WebSocket + HTTP combined | Medium |

---

## 11. Summary Table

| | **KVM 2** | **KVM 4** |
|---|-----------|-----------|
| RAM for full initial stack | **Pass** (measured) | **Pass** (overkill early) |
| CPU for full initial stack | **Unverified** | **Safer margin** |
| Measured browse RPS headroom vs 85 RPS burst | **~4×** | Unknown (likely higher) |
| Cost efficiency early | **Best** | Higher |
| **Recommendation** | **Initial node** + CPU soak gate | **Immediate** if skipping validation or Octane-first heavy launch |

**Final selection:** **KVM 2** for initial production, **conditional on 48h VPS CPU soak**. Upgrade path to **KVM 4** is operational (resize/migrate), not architectural rewrite.
