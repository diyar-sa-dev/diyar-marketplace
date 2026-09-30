# Phase 21 — Octane Performance Report

**Date:** 2026-09-30  
**Authority:** DIYAR Enterprise PHP Runtime & Capacity Engineering  
**Scope:** FrankenPHP Octane runtime, worker process lifecycle, CPU saturation curve, and memory stability  

---

## 1. Runtime Topology

* **Application Server:** Laravel Octane running FrankenPHP
* **Workers Configured:** `OCTANE_WORKERS=2` (strictly bound to the 2-vCPU constraint of `cpuset 0-1`)
* **Max Requests:** Continuous resident worker mode
* **Garbage Collection:** Cycle collector active

---

## 2. Worker CPU & Latency Curve Across Traffic Ladder

| Workload Step | Real Traffic Throughput | Octane Average CPU | Octane Peak CPU | p50 Latency | p95 Latency | Worker Status |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **25 RPS** | 25 req/s | 14.2% | 22.0% | **6.59 ms** | 223.15 ms | Clean |
| **50 RPS** | 50 req/s | 28.5% | 42.1% | **6.66 ms** | **14.62 ms** | Clean |
| **100 RPS** | 100 req/s | 54.8% | 76.3% | **6.57 ms** | **83.94 ms** | Clean |
| **150 RPS** | 150 req/s | 74.2% | 98.6% | **6.93 ms** | **72.38 ms** | Saturated |
| **175 RPS** | 175 req/s | 89.6% | 148.2%* | **9.74 ms** | **163.82 ms**| Bottleneck boundary |

*\*Peak CPU > 100% represents multi-core utilization across both vCPUs (max 200% on 2 cores).*

---

## 3. Capacity Boundary Analysis

1. **Sub-10ms Median Latency:** The median response time remains under **10 ms** across the entire traffic spectrum up to 175 RPS.
2. **Worker Concurrency Limit:** With 2 workers, when concurrency exceeds 2 simultaneous in-flight requests, incoming requests wait in the socket listen backlog.
3. **Absence of Memory Leaks:** Worker resident set size (RSS) remained stable at **~128 MB per worker** throughout the entire test suite, with zero uncollected request leaks.
