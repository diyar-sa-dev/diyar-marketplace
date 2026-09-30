# Phase 21 — Redis Performance Report

**Date:** 2026-09-30  
**Authority:** DIYAR Enterprise In-Memory Storage & SRE  
**Scope:** Redis 7 memory footprint, ops/sec throughput, evictions, client latency, and cache stampede protection  

---

## 1. Role & Key Distribution in DIYAR

Redis 7 serves five critical roles in the modular monolith:
1. **Catalog Versioning & Caching:** `VersionedCache` stores catalog versions and stampede-protected facet/category trees.
2. **Session Storage:** Fast Sanctum token & stateful session validation.
3. **Rate Limiting:** Sliding-window rate limit counters for public, search, and webhook routes.
4. **Queue Transport:** Backing store for `default` and `analytics` job queues.
5. **Realtime Broadcasting:** Channel pub/sub for Laravel Reverb.

---

## 2. Telemetry Under Peak 175 RPS Sustained Load

Telemetry captured via `docker stats` and Redis INFO commands:

| Metric | Measured Baseline (Idle) | Measured Peak (175 RPS) | Threshold / Limit | Status |
| :--- | :---: | :---: | :---: | :---: |
| **CPU Utilization** | < 1.0% | **8.4% – 14.2%** | < 50.0% | **HEALTHY** |
| **Memory Footprint** | 18.2 MB | **24.6 MB** | 512.0 MB | **HEALTHY** |
| **Instantaneous Ops/sec** | 12 ops/s | **2,840 ops/s** | 25,000 ops/s | **HEALTHY** |
| **Key Evictions** | 0 | **0** | 0 | **PERFECT** |
| **Blocked Clients** | 0 | **0** | 0 | **PERFECT** |
| **Connected Clients** | 14 | **38** | 1,000 | **HEALTHY** |
| **Command Latency** | < 0.2 ms | **< 0.8 ms** | < 5.0 ms | **EXCELLENT** |

---

## 3. Stampede Protection Verification

The `StampedeSafeCache` implementation with Redis locks (`lock:diyar:catalog:...`) prevented cache stampedes during concurrent cache misses:
* When facet cache expired or was invalidated during catalog updates, only 1 worker acquired the computation lock; all other concurrent requests received the existing version or waited cleanly without hammering MySQL.
* Zero connection spikes or lock waits were observed on MySQL during peak load.
