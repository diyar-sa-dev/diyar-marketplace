# DIYAR — KVM2 Capacity and Bottleneck Investigation (Phase 1–2)

**Date:** 2026-09-21  
**Git:** `d1d6c48`  
**Scope:** Local Docker KVM2-equivalent simulation only. **Not** Hostinger. **Not** production.  
**Evidence:** `backend/storage/certification/kvm2-equivalent/phase1-2/`  
**No application code changes. No optimization. No git commit.**

Certification labels used below: **VERIFIED**, **VERIFIED WITH LIMITATIONS**, **NOT VERIFIED**, **BLOCKED**.

---

## A. Executive Summary

```text
KVM2 simulation status:     VERIFIED WITH LIMITATIONS
Capacity status:            mixed storefront saturates ~45–50 RPS (p95 > 2 s)
First degradation:          vu25 mixed — p95 1074 ms (was ~369 ms on the loose 4-CPU run)
Saturation point:           vu50 / rps50 mixed — ~47–49 RPS, p95 ~2.3–2.4 s
Primary bottleneck:         mixed 2-vCPU saturation (Octane + MySQL) AND
                            GET /api/v1/products listing path (not search)
Secondary bottlenecks:      synchronous analytics_events INSERT on product detail;
                            scheduler sharing the same 2 CPUs
Confidence:                 HIGH on capacity curve and search-vs-products isolation;
                            MEDIUM on exact SQL of listPublic (PFS digest did not record Octane queries)
Hostinger capacity:         NOT VERIFIED
Production capacity:        NOT VERIFIED
```

Previous 4-CPU / 12 GB campaign (~103 RPS at vu100, p95 2 s) is **not comparable**. That run allowed the stack ~3.95 CPU of CFS quota on a 4-CPU VM. This run pins the stack to **CPUs 0–1 only**.

---

## B. Environment

### Host / Docker VM

| Item | Measured |
|------|----------|
| Host | Windows 10, 12 logical processors, 29.8 GiB RAM |
| `.wslconfig` | `memory=8GB`, `processors=4`, `swap=2GB` |
| `docker info` NCPU | **4** |
| `docker info` MemTotal | **8 328 425 472 bytes (~7.76 GiB)** |
| Stack cpuset (all DIYAR containers) | **0-1** (`docker inspect HostConfig.CpusetCpus`) |
| k6 cpuset | **2-3** |
| Per-container CPU quotas | **removed** (previous overlay summed to 3.95) |

```text
CPU equivalence: VERIFIED WITH LIMITATIONS
  — stack is confined to two Docker-VM vCPUs (inspect-confirmed).
  — those vCPUs are Docker Desktop virtual cores, not Hostinger KVM2 silicon.
  — k6 is deliberately outside the envelope (CPUs 2-3).

RAM envelope: VERIFIED WITH LIMITATIONS
  — Docker VM ~7.76 GiB after WSL restart.
  — cgroup memory limits sum 6464 MiB (~6.3 GiB).
  — kernel page cache and k6 still share the 8 GiB VM.
```

### Container budget

| Container | Role | cpuset | Memory limit | CPU reservation |
|-----------|------|--------|--------------|-----------------|
| app | Octane/Swoole | 0-1 | 1536 MiB | none (share 2 cores) |
| mysql | MySQL 8 | 0-1 | 2560 MiB | none |
| redis | Redis 7 | 0-1 | 576 MiB | none |
| nginx | reverse proxy | 0-1 | 128 MiB | none |
| queue-critical | `queue:work` | 0-1 | 384 MiB | none |
| queue-default | `queue:work` | 0-1 | 384 MiB | none |
| scheduler | `schedule:run` loop | 0-1 | 128 MiB | none |
| reverb-1 | WebSocket | 0-1 | 384 MiB | none |
| reverb-2 | WebSocket | 0-1 | 384 MiB | none |
| **sum** | | **2 vCPU shared** | **6464 MiB** | |
| k6 | load generator | 2-3 | unbounded | outside envelope |

### Runtime (measured)

| Component | Value |
|-----------|--------|
| Laravel | 13.26.1 |
| PHP | 8.3.33 |
| Swoole | yes |
| OCTANE_WORKERS | 2 |
| Octane | `php artisan octane:status` → running |
| MySQL | 8.0.46 |
| `innodb_buffer_pool_size` | **536870912 (512 MiB)** after argv override |
| `max_connections` | **100** after argv override |
| Redis | maxmemory 512 mb, allkeys-lru |
| Nginx | 1.27, stub_status on loopback only |
| Queues | redis driver; health/ready `pending_jobs=0`, `failed_jobs=0` |
| Reverb | 2 processes, cpuset 0-1 |
| `DIYAR_LOADTEST_MODE` | false (rate limits ON) |
| HTTP | `127.0.0.1:8193` → nginx → Octane `:8000` |

**Test-environment fix (documented, not an app optimization):**  
`deploy/docker/mysql-kvm2.cnf` bind-mount is **world-writable on Docker Desktop NTFS** and MySQL 8 **ignores** it (`World-writable config file ... is ignored`). Previous reports claiming 512 MiB buffer pool / 100 connections were **wrong** (actual was 128 MiB / 151). Phase 1 passes the knobs on `mysqld` argv in `docker-compose.kvm2-test.yml`.

Nginx `stub_status` at `/nginx_status` (allow 127.0.0.1 only) was added for during-load sampling.

---

## C. Workload

Script: `scripts/performance/kvm2-phase2-diagnostics.js`  
Orchestrator: `scripts/performance/run-kvm2-phase2.ps1 -SkipRecreate`  
Sampler: `scripts/performance/kvm2-phase2-sampler.ps1` (JSONL **during** k6, not after)  
Stage: **90 s** (health 30 s, vu5 45 s). Mixed storefront + isolated classes.

k6 path: container on CPUs 2–3 → Docker network → `http://nginx/api/v1`.

Rate-limit spreading: `X-Forwarded-For` per VU (existing helper). **0 × 429** on all profiles.

---

## D. Capacity Curve

Local KVM2-equivalent only. Errors = http_req_failed rate.

### Mixed / arrival

| Load | Actual RPS | p50 ms | p95 ms | p99 ms | 429 | 5xx | err |
| ---: | ---------: | -----: | -----: | -----: | --: | --: | --: |
| health 10 VU | 34.19 | 8.1 | 20.4 | 118.8 | 0 | 0 | 0 |
| 5 VU mixed | 13.78 | 8.8 | 464.8 | 752.0 | 0 | 0 | 0 |
| 10 VU mixed | 27.63 | 9.5 | 328.7 | 810.4 | 0 | 0 | 0 |
| 25 VU mixed | 44.49 | 18.5 | **1074.4** | 1413.6 | 0 | 0 | 0 |
| 50 VU mixed | 48.86 | 258.5 | **2255.8** | 3270.8 | 0 | 0 | 0 |
| **25 RPS** target | **24.78** | 11.0 | 440.0 | 772.6 | 0 | 0 | 0 |
| 50 RPS target | 46.58 | 344.6 | **2389.7** | 3170.7 | 0 | 0 | 0 |
| 75 RPS target | 60.01 | 2032.8 | 3345.6 | 3988.6 | 0 | 0 | 0 |
| 100 RPS target | 67.34 | 444.3 | 4346.7 | 5585.6 | 0 | 0 | 0 |
| 125 RPS target | 76.52 | 9.9 | 5997.4 | 7066.4 | 0 | 0 | 0 |
| 150 RPS target | 85.38 | 51.8 | 5770.5 | 6941.8 | 0 | 0 | 0 |
| 200 RPS target | 120.56 | 104.5 | 8368.1 | 10397.8 | 0 | 0 | 0 |

Arrival-rate tests **did not meet** targets above 25 RPS. 200 RPS requested → 120.6 actual with p95 8.4 s. That is queueing, not useful capacity.

### Isolated classes (25 VU, 90 s) — confirmation of *what* is slow

| Workload | Actual RPS | p50 | p95 | p99 |
|----------|----------:|---:|---:|---:|
| **search-only** `GET /catalog/search` | **85.84** | 7.9 | **34.2** | 161.2 |
| **products-only** `GET /products?per_page=12` | **22.71** | 822.0 | **1738.5** | 2218.6 |
| **detail-only** `GET /products/{id}` | 34.66 | 516.1 | 861.0 | 1032.5 |

Repeat products-only 60 s (confirmation): **23.94 RPS**, p95 **1207.8 ms**, 0 errors.

Search is **not** the mixed-workload limiter. Listing is.

---

## E. Resource Curve (DURING load)

Source: `phase1-2/sampler-campaign.jsonl` (229 samples). Docker `cpu%` is percent of **one** Docker-VM CPU (VM has 4). A container on cpuset 0-1 can approach ~200%.

| Load (window ±100s of profile end) | app CPU | mysql CPU | redis CPU | nginx CPU | app RSS | mysql RSS | redis RSS | MySQL thr_running | redis ops/s |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| vu10 | 57.8% | 89.4% | 6.8% | 2.8% | 211 | 486 | 154 | 4 | 1562 |
| vu25 | 82.3% | **109.5%** | 31.0% | 4.5% | 242 | 487 | 157 | 4 | 3107 |
| vu50 | 98.6% | **110.1%** | 31.0% | 4.7% | 210 | 489 | 158 | 4 | 3135 |
| rps25 | 66.0% | 100.0% | 17.0% | 1.7% | 212 | 490 | 159 | 4 | 958 |
| rps50 | 76.6% | 98.6% | 7.7% | 3.0% | 211 | 490 | 161 | 4 | 1404 |
| search | 76.6% | 107.6% | 10.4% | 4.2% | 211 | 491 | 169 | 3 | 1669 |
| products | 77.6% | **111.1%** | 43.5% | 1.9% | 237 | 492 | 172 | 4 | 1045 |
| rps200 | **116.3%** | 104.5% | 16.7% | 5.5% | 213 | 495 | 184 | 4 | 3607 |

Campaign peaks: app 116%, mysql 111%, redis 89%, nginx 5.5%, scheduler **73%**, k6 ≤ 19% (other CPUs).  
MySQL `Threads_connected` peak **3**, `Threads_running` peak **4** — **not** connection-bound (max_connections=100).  
Redis `evicted_keys` **0**. No container OOM. App RSS stayed ~210–245 MiB / 1536 MiB.

**Face B on the search row:** ±100 s windows overlap neighboring profiles, so search-window MySQL CPU is **not** a clean isolation metric. Use k6 latency isolation (34 ms vs 1738 ms) for search vs products, not that CPU slice.

---

## F. Bottleneck Analysis

### Hypothesis 1 — Search is the mixed-workload limiter

| | |
|--|--|
| Evidence for | Mixed workload is 40% search. Older reports emphasized Day-29 search. |
| Evidence against | 25 VU search-only: **85.8 RPS, p95 34 ms**. 25 VU products-only: **22.7 RPS, p95 1738 ms**. |
| Confirmation | Same envelope, same VU, isolated k6 profiles. |
| Conclusion | **Rejected.** Search is healthy in this simulation. |
| Confidence | HIGH |

### Hypothesis 2 — Redis is the limiter

| | |
|--|--|
| Evidence for | redis ops/s peak 3607; RSS grew 153→184 MiB. |
| Evidence against | `evicted_keys=0`; search (cache-heavy) is fast; products (slower) has *lower* redis ops (1045) than rps100 (2447). |
| Conclusion | **Rejected as primary.** Redis is busy, not the p95 driver. |
| Confidence | HIGH |

### Hypothesis 3 — Nginx is the limiter

| | |
|--|--|
| Evidence for | active connections peak 363 at rps200. |
| Evidence against | nginx CPU peak 5.5%; health endpoint p95 20 ms at 34 RPS. |
| Conclusion | **Rejected.** |
| Confidence | HIGH |

### Hypothesis 4 — k6 / Docker Desktop is the limiter

| | |
|--|--|
| Evidence for | Windows Docker VM; previous run used host.docker.internal poorly. |
| Evidence against | k6 cpuset 2-3, CPU peak 19%; k6 achieved 120 RPS requested-arrival (server just got slow). Health 34 RPS p95 20 ms. |
| Conclusion | **Rejected as primary.** Residual VM noise remains a limitation. |
| Confidence | MEDIUM-HIGH |

### Hypothesis 5 — MySQL connection / lock bound

| | |
|--|--|
| Evidence for | MySQL CPU ~100%+ under mixed/products. |
| Evidence against | `Threads_connected` peak 3; `Innodb_row_lock_waits` 0 in sampler snapshots; slow-log `Lock_time` ~0. |
| Conclusion | **Rejected** for connections/locks. |
| Confidence | HIGH |

### Hypothesis 6 — 2 vCPU shared saturation (Octane + MySQL)

| | |
|--|--|
| Evidence for | From vu25 onward app+mysql docker CPU each ~80–110% on a 2-CPU cpuset (together occupying both cores). p95 collapses while HTTP still returns 200. Scheduler also hit 73% on the same two cores. |
| Evidence against | Search-only still fast, so not “the whole app is CPU-dead.” |
| Confirmation | Capacity fell vs the 4-CPU campaign at the same git (vu25 p95 369 ms → 1074 ms). |
| Conclusion | **Accepted as the infrastructure envelope bottleneck.** |
| Confidence | HIGH |

### Hypothesis 7 — GET /products listing is the expensive application path

| | |
|--|--|
| Evidence for | Isolated 25 VU: products p95 1738 ms vs search 34 ms vs detail 861 ms. Reproduced 60 s: products 23.9 RPS p95 1208 ms. Code path: `ProductController::index` → `ProductService::listPublic`. |
| Evidence against | Exact SQL of `listPublic` **not** in performance_schema (Octane/Swoole statements were not digested; only the sampler’s `SHOW GLOBAL STATUS`). Slow log did not record SELECT statements (likely each query < `long_query_time=1`). |
| Conclusion | **Accepted as the primary application-path bottleneck**, with SQL-shape **NOT VERIFIED**. |
| Confidence | HIGH on *which endpoint*; MEDIUM on *which query*. |

### Hypothesis 8 — Product detail analytics INSERT adds latency

| | |
|--|--|
| Evidence for | Slow log (5 events, all the same shape): `insert into analytics_events … 'product_viewed' … source=product_detail` with **Query_time 1.02–1.70 s**, Rows_examined 0, Lock_time ~0. Code: `ProductController::show` → `ProductViewAnalyticsService::recordFromProductShow` (synchronous). |
| Evidence against | Listing does not call that recorder; listing is still slower than detail, so this is **not** the list bottleneck. |
| Conclusion | **Accepted as a secondary, proven write-path cost on detail** under 2-vCPU contention (`innodb_flush_log_at_trx_commit=1`). |
| Confidence | HIGH |

### Classification

```text
Primary:   mixed bottleneck
           — CPU-bound at the 2-vCPU envelope (Octane + MySQL sharing cores)
           — application-code / query-bound on GET /api/v1/products (listPublic)
Secondary: analytics_events INSERT on product show (slow log)
           scheduler CPU on the same cpuset
Not:       Redis-bound, Nginx-bound, MySQL connection-bound, search-query-bound,
           RAM-bound, k6-bound, HTTP 5xx/429
```

---

## G. Stress Test Result

```text
First degradation (p95 > 500 ms mixed, sustained):   vu25 (p95 1074 ms) / between rps25 and rps50
First p95 > 2 s mixed:                               vu50 (2256 ms), rps50 (2390 ms)
First resource saturation:                           vu25–vu50 — MySQL ~1.1 Docker-CPU, app ~0.8–1.0
Maximum sustainable mixed (p95 < 500 ms):            ~25 RPS (rps25: 24.78 RPS, p95 440 ms)
                                                     vu10: 27.6 RPS, p95 329 ms
Maximum observed mixed throughput:                   120.6 RPS at rps200 (p95 8368 ms) — not useful
Failure boundary:                                    none — 0% errors, 0×5xx, 0×429, no OOM, no restart
What stayed healthy:                                 search-only; health; Redis evictions; MySQL connections;
                                                     HTTP correctness
```

Stopped increasing past 200 RPS requested: latency already multi-second, no 5xx, further RPS would only inflate queueing.

Authenticated marketplace API and room-designer save: **NOT VERIFIED** (no session load; `/auth/me` unauthenticated = 401; marketplace maintenance flag true in health payload).

---

## H. Optimization Recommendations

**Do not implement in this phase.**

### P0 — must investigate before claiming KVM2 fitness

1. **`ProductService::listPublic` / `GET /products`** — explain query plan, N+1, and payload work. Listing is ~50× slower in p95 than search at the same 25 VU.
2. **Synchronous `product_viewed` INSERT** on `ProductController::show` — slow log 1.0–1.7 s under contention. Consider queueing (not done here).

### P1 — should fix before scaling the VPS

3. Keep **Octane workers = 2** until listing is cheaper; more workers on 2 vCPU will steal from MySQL (hypothesis, not tested — worker sweep **not run** to avoid turning diagnosis into tuning).
4. **Scheduler** sharing cpuset 0-1 hit 73% CPU; isolate or quiet it during capacity tests / on KVM2.
5. Make `mysql-kvm2.cnf` actually apply (non-world-writable copy) so production and lab match.

### P2 — optimization opportunity

6. Buffer pool 512 MiB is small vs 2.5 GiB MySQL cgroup; only raise after listing SQL is known.
7. `innodb_flush_log_at_trx_commit=1` is correct for durability; analytics writes amplify it.

### P3 — future scaling

8. Hostinger KVM2 trial with the same k6 + during-load sampler. **This report must not be cited as Hostinger RPS.**
9. If listing is optimized and 2 vCPU still pegs, then scale (KVM4 or split DB) — **optimize → retest → scale**.

---

## I. QA handoff (reproduce)

```powershell
# 1. WSL2 Docker VM (already set on this PC)
#    %USERPROFILE%\.wslconfig → memory=8GB, processors=4
#    wsl --shutdown  then start Docker Desktop
#    docker info  → NCPU=4, MemTotal ≈ 8e9

# 2. Stack (project diyar-kvm2-test, port 8193)
.\scripts\performance\run-kvm2-phase2.ps1 -SkipCampaign
# expect: inspect cpuset=0-1; MySQL innodb_buffer_pool_size=536870912

# 3. Campaign + sampler
.\scripts\performance\run-kvm2-phase2.ps1 -SkipRecreate

# 4. Evidence
# backend/storage/certification/kvm2-equivalent/phase1-2/summary-*.json
# backend/storage/certification/kvm2-equivalent/phase1-2/sampler-campaign.jsonl
```

Thresholds used here (not product SLOs): mixed p95 500 ms = first degradation; p95 2000 ms = saturation; stop if 5xx or OOM.

---

## J. Software engineering handoff

| What is slow | Where | Evidence |
|--------------|-------|----------|
| Catalog listing | `ProductController::index` → `ProductService::listPublic` | 25 VU products p95 1738 ms vs search 34 ms |
| Product detail extra write | `ProductController::show` line 35 → `ProductViewAnalyticsService::recordFromProductShow` | slow log INSERT `analytics_events` 1.0–1.7 s |
| Infra contention | 2 Octane workers + mysqld on cpuset 0-1 | during-load docker stats |

**Next investigation (not done):** Laravel query log / `EXPLAIN` on `listPublic` under one request; `performance_schema` consumers for Octane connections (digest was empty for app SQL).

Do not “optimize the database” blindly. The proven expensive *write* is `analytics_events` insert. The proven expensive *endpoint* is listing; its SQL is not yet identified.

---

## K. Face A / Face B review

### Face A

Environment recreated with cpuset + 8 GiB VM. During-load sampler captured. Conservative VU then arrival-rate then isolation then 200 RPS stress. Bottleneck named. Report written.

### Face B

| Attack | Answer |
|--------|--------|
| Could host resources contaminate? | Previously yes (4 CPU / 12 GB). This run: VM 8 GB, stack cpuset 0-1. Residual: Docker Desktop virtualization. |
| Could Docker distort CPU? | Yes — `cpu%` is VM-relative. We treat ~100% as one vCPU, not Hostinger steal-time. |
| Could k6 be the bottleneck? | Unlikely: cpuset 2-3, ≤19% CPU, health p95 20 ms. |
| Could rate limits distort? | 0×429. |
| Could MySQL be under-measured? | PFS digest **failed** to record Octane SQL. Slow log only catches ≥1 s. Listing SQL still unknown. |
| Could Redis be under-measured? | INFO sampled every ~6 s; evictions 0. |
| Could Octane workers mask the bottleneck? | 2 workers on 2 CPUs **are** part of the envelope bottleneck. We did **not** A/B 2 vs 4 workers (that would be tuning). Isolation already shows listing vs search. |
| Unrealistic workload? | Mixed GET storefront; no checkout. Auth/room-designer **NOT VERIFIED**. Seed catalog is small (12 products) — listing is slow *anyway*, which is worse news, not better. |
| Confused max vs sustainable throughput? | Sustainable mixed ≈ **25 RPS p95 < 500 ms**. Max observed 121 RPS is latency collapse. |
| Hostinger claim? | **Forbidden. NOT VERIFIED.** |

---

## L. Final certification states

```text
KVM2 resource envelope:     VERIFIED WITH LIMITATIONS
CPU equivalence:            VERIFIED WITH LIMITATIONS
RAM envelope:               VERIFIED WITH LIMITATIONS
Capacity curve (local):     VERIFIED
Bottleneck identification:  VERIFIED WITH LIMITATIONS
Search-as-limiter:          rejected (VERIFIED)
Hostinger capacity:         NOT VERIFIED
Production capacity:        NOT VERIFIED
Authenticated / room-design load: NOT VERIFIED
```

**Decision for the next phase (not taken here):**  
Under this local 2-vCPU envelope, DIYAR mixed storefront is **not** comfortably at 50–100 RPS. It **is** comfortable near **25 mixed RPS** and **search-only ~86 RPS**. The next engineering step is **OPTIMIZE listing + defer analytics writes, then RETEST**, not SCALE first.
