# Queue Performance — Phase 28.7

**Date:** 2026-08-27

---

## Configuration

| Context | `QUEUE_CONNECTION` |
|---------|-------------------|
| Octane API (measured) | **redis** |
| One-off compose `run` scripts | sync (default compose env) |

---

## Health endpoint observations (during load)

From `GET /api/v1/health` on running Octane container:

| Metric | Value |
|--------|-------|
| queue driver | redis |
| pending_jobs | **0** (before, during, after k6 profiles) |
| failed_jobs | **0** |

No queue accumulation observed during 100 VU load, spike, or 5 min soak.

---

## stage28-queue-verify.php

**Status:** **FAILED** in standalone Docker run  
**Cause:** DB credential mismatch (`loadtest` password vs volume `staging_root`) — PERF-028-002

Script could not count `failed_jobs` without DB access. This is a **test environment limit**, not a queue defect.

Prior Phase 28.1 local verify with `QUEUE_CONNECTION=sync`: PASS (~246 ms worker_once).

---

## Workloads NOT measured

| Workload | Status |
|----------|--------|
| Notification dispatch throughput | Not load-generated |
| Email jobs/min | Not tested (no real mail) |
| Broadcast fan-out | Not tested |
| Analytics background jobs | Not isolated |
| Worker utilization % | Not instrumented |

---

## Classification

**PARTIAL** — No queue backlog under HTTP load; worker throughput not quantified.

---

## Optimization candidates (deferred)

| ID | Note |
|----|------|
| OPT-QUEUE-001 | Benchmark notification job drain rate with redis worker under checkout load |
| OPT-QUEUE-002 | Measure failed_job retry rate on staging |
