# Phase 21 — Bottleneck Analysis & Capacity Boundary

**Date:** 2026-09-30  
**Authority:** DIYAR Enterprise Performance & Capacity Engineering  
**Scope:** Root cause mapping, bottleneck ranking, component boundaries, and capacity limits  

---

## 1. Primary Platform Bottleneck: Octane Worker Concurrency Boundary

The single actual bottleneck observed in the KVM2-equivalent envelope is:

```text
High Concurrency / High RPS (>150 RPS)
  ↓
2 FrankenPHP Octane Workers saturated on 2 vCPUs
  ↓
In-flight requests exhaust available worker processes
  ↓
Incoming HTTP requests wait in Nginx upstream connection queue
  ↓
p95 / p99 tail latency rises from 14ms to 160ms+
```

### Supporting Evidence:
* **MySQL CPU:** Remains **< 8%** at 150 RPS.
* **MySQL Query Execution:** Under 15 ms for indexed queries and fulltext search.
* **Redis CPU:** Remains **< 15%** at 150 RPS with zero key evictions.
* **Octane CPU:** Reaches **~90% average / 148% peak** across both vCPUs at 175 RPS.
* **Nginx Waiting Connections:** Directly mirrors the Octane worker saturation curve.

---

## 2. Eliminated Bottlenecks (Verified Resolutions)

1. **MySQL 10K Fulltext Search Degradation:**
   - **Resolved:** Removed redundant `OR LIKE` fallback that invalidated `products_search_fulltext` index. Search latency at 10,000 products reduced from ~410 ms to ~14 ms.
2. **Correlated Subquery Amplification:**
   - **Resolved:** Decoupled review aggregate counts/averages into a single 0.29 ms batch query for card collections.
3. **Queue Ingress Contamination:**
   - **Resolved:** Queue isolation verified; zero queue backlog or failed jobs during heavy traffic.
4. **Frontend Asset Bloat:**
   - **Resolved:** Strict code-splitting keeps critical initial JS bundle to ~390 KB raw (~124 KB compressed).
