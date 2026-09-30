# Phase 20 Face 3 — Root-Cause & Causal Attribution Review

**Date:** 2026-09-30  
**Authority:** Autonomous Performance & Systems Architecture Team  
**Focus:** Full Causal Chain Reconstruction for Phase 20 Runtime, Queue Isolation, and Cardinality Scaling  

---

## 1. Causal Reconstruction: Request Waiting & Worker Saturation

```text
[HTTP Ingress Rate >= 175-200 RPS]
                 │
                 ▼
[Incoming Requests Arrive at Nginx Socket (:8193)]
                 │
                 ▼
[Octane Swoole Dispatch (Strictly 2 Worker Processes on CPU 0-1)]
                 │
                 ├────────────────────────┬────────────────────────┐
                 ▼                        ▼                        ▼
       [Listing Request]          [Detail Request]         [Search Request]
       Cache/Index scan           Cache / PK lookup        Fulltext + SQL filter
       Duration: ~5-15 ms         Duration: ~5-25 ms       Duration: ~15-380 ms
                 │                        │                        │
                 └────────────────────────┴────────────────────────┘
                                          │
                                          ▼
                      [Mean Worker Occupancy: ~10-15 ms]
                                          │
                                          ▼
              [Maximum Theoretical 2-Worker Throughput: ~130-180 RPS]
                                          │
    ┌─────────────────────────────────────┴─────────────────────────────────────┐
    │                                                                           │
    ▼                                                                           ▼
[Below 150 RPS]                                                         [Above 175 RPS]
Queue wait time ~0 ms                                                   Workers busy 100% of time
Nginx socket backlog = 0                                                Incoming requests wait in Nginx
p95 latency: 15-60 ms                                                   App CPU: 77-145% (both vCPUs pinned)
                                                                        Socket backlog builds to 150-330
                                                                        p95 latency elevates to 250-1200 ms
```

### Attribution Verdict:
1. **The Primary Saturation Mechanism:** Request waiting at the Octane worker barrier.
2. **Underlying Resource:** Physical CPU saturation of the two application cores (`cpuset 0-1`).
3. **No Phantom Stall:** Neither MySQL locks, nor Redis connection pool starvation, nor disk I/O, nor memory thrashing caused the queue waiting. It is the direct consequence of request arrival rate exceeding worker execution capacity in the 2-vCPU / 2-worker envelope.

---

## 2. Causal Reconstruction: Queue Isolation Behavior (Phase 20.1)

### Question: Why did offloading search analytics to a dedicated queue not improve HTTP latency?
1. **HTTP Ingress Path:**
   - In Laravel Octane, dispatching `RecordSearchQueryAnalyticsJob` to Redis via `Queue::push()` consists of a single `RPUSH` operation taking **~0.2–0.4 ms**.
   - The HTTP response does NOT wait for the worker to process the job.
2. **Worker Scheduling Contention:**
   - When running only `queue-default` and `queue-critical`, two background worker processes are active.
   - When launching `queue-analytics` in the same container environment, a third background PHP worker process is placed on `cpuset 0-1`.
   - Under heavy HTTP load (175–200 RPS) where Octane workers are already utilizing 80–100% CPU, the third worker process competes with Octane for CPU cycles.
3. **Operational vs Performance Value:**
   - **Operational QoS:** Dedicated analytics queue prevents heavy analytics backlogs from delaying transactional emails, payment webhooks, or order fulfillment notifications in the default queue (100% isolation verified).
   - **HTTP Latency:** No latency reduction occurs because HTTP ingress was never blocked on queue processing.

---

## 3. Causal Reconstruction: Cardinality Scaling & Search Bottleneck (Phase 20.2)

### Catalog Scaling Trajectory:
- **At 12 products:** Search p95 = 26.3 ms, Listing p95 = 30.9 ms.
- **At 1,000 products:** Search p95 = 15.1 ms, Listing p95 = 13.6 ms.
- **At 10,000 products:** Search `q=chair` p95 = 377.1 ms, `q=table` p95 = 379.9 ms; sustained 150 RPS mixed p95 = 387.6 ms.

### Root-Cause Analysis for Search Degradation at 10K Rows:
1. **SQL Query Structure:**
   ```sql
   SELECT products.* FROM products
   WHERE MATCH(products.name, products.description) AGAINST(? IN BOOLEAN MODE)
      OR products.name LIKE '%...%'
   ORDER BY created_at DESC LIMIT 12;
   ```
2. **Correlated Subqueries:** Attached `withCount('reviews')` and `withAvg('reviews', 'rating')`.
3. **Execution Plan:**
   - At 12–1,000 rows, candidate result set is tiny; MySQL completes the full query in <5 ms.
   - At 10,000 rows, broad keywords (`chair`, `table`) produce large candidate sets matching the `OR ... LIKE` fallback, forcing temporary table materialization and filesort across reviews.
   - MySQL execution time jumps from 15 ms to ~380 ms.
4. **Impact on Octane:**
   - When a search query takes 380 ms in MySQL, the Octane worker is blocked waiting on the database connection for 380 ms instead of 10 ms.
   - 2 workers blocked for 380 ms can only serve ~5 search queries per second before saturating.
   - Consequently, all other HTTP traffic queues in Nginx, driving sustained 150 RPS p95 to 387.6 ms.

### Conclusion & Architectural Direction:
The catalog architecture is highly efficient for browse listing and product detail up to 10,000 products. For search, standard MySQL `LIKE` / `MATCH` reaches its scalability limit at 10K products under high concurrency. Dedicated search indexing (Meilisearch in Stage 26.9) is the proven architectural remedy.
