# Phase 21 — Queue Performance Report

**Date:** 2026-09-30  
**Authority:** DIYAR Enterprise Async Workload & Performance Engineering  
**Scope:** Queue isolation, background job processing, queue backlog, and failure rates  

---

## 1. Queue Architecture & Workload Routing

DIYAR maintains two primary queue pipelines backed by Redis:
* **`default` Queue:** Critical user-facing asynchronous tasks (order confirmation dispatch, payment receipts, notification pushes).
* **`analytics` Queue:** Non-critical background telemetry (engagement metrics, search queries tracking, clickstream logs).

---

## 2. Queue Telemetry Across Whole-Platform Runs

Measured before, during, and after the 25–175 RPS traffic ladder:

| Queue Name | Initial Depth | Peak Enqueued | Drain Duration | Final Depth | Failed Jobs |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`queues:default`** | 0 | 14 | < 1.5s | **0** | **0** |
| **`queues:analytics`**| 0 | 48 | < 3.2s | **0** | **0** |
| **`failed_jobs` table** | 0 | 0 | — | **0** | **0** |

---

## 3. Worker Contention Analysis

* **Worker CPU Footprint:** `diyar-kvm2-test-queue-worker-1` consumed **< 4.5% CPU** during sustained traffic bursts.
* **Worker Memory:** Remained stable at **~42 MB** without memory leaks across job cycles.
* **HTTP Isolation:** Background job processing on `cpuset 0-1` had negligible impact on Octane HTTP requests because job execution is light and non-blocking.
* **Queue Invariant Confirmed:** Zero failed jobs, zero dead letters, and 100% completed job processing.
