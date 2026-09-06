# Redis Performance — Phase 28.7

**Date:** 2026-08-27  
**Redis:** 7.4.7 (Docker alpine)  
**Script:** `stage28-redis-benchmark.php`  
Raw: `raw/_redis_benchmark_docker.json`

---

## Latency (10 samples, warm PHP process)

| Operation | p50 | p95 | max |
|-----------|-----|-----|-----|
| Redis PING (warm) | 0.11 ms | **0.17 ms** | 0.17 ms |
| Raw SET/GET/DEL | 0.33 ms | 0.43 ms | 0.43 ms |
| Laravel cache roundtrip | 0.37 ms | **1.35 ms** | 1.35 ms |
| Laravel queue size probe | 0.14 ms | 1.61 ms | 1.61 ms |

First ping after bootstrap: **2.75 ms** (includes connection setup).

---

## Memory & connections (idle, post-load)

| Metric | Value |
|--------|-------|
| used_memory | 1.43M |
| connected_clients | 16 (during active Octane + tests) |

---

## Workloads tested

| Workload | Result |
|----------|--------|
| Cache reads/writes | Sub-ms typical |
| Session driver (configured) | Not isolated — uses same Redis |
| Rate limiting | Relaxed via `DIYAR_LOADTEST_MODE` |
| Queue interaction | Size probe OK; full worker throughput not benchmarked |

---

## Bottleneck assessment

Redis is **not** the observed bottleneck for tested HTTP workloads at ≤100 VU. p95 HTTP latency (248 ms @ 100 VU) far exceeds Redis p95 (1.35 ms cache).

---

## Classification

**PASS** — Redis performance adequate for measured load on local Docker stack.

---

## Optimization candidates (deferred)

| ID | Note |
|----|------|
| OPT-REDIS-001 | No action indicated at current scale — re-verify at 500+ VU on staging |

Prior Phase 28.1 local Redis ping ~0.61 ms p95 — consistent order of magnitude.
