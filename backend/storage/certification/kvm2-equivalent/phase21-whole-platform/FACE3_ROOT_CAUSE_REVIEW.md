# Phase 21 — Face 3: Root Cause & Causal Attribution Review

**Date:** 2026-09-30  
**Authority:** Principal Performance Architect & SRE  
**Scope:** Formal causal chains connecting user traffic, runtime resources, and observed latency  

---

## 1. Causal Chain: Search Scalability (Stage 26.9 Validation)

```text
User Search Query (`q=term`)
  ↓
ProductService::applyFilters
  ↓
Condition: MATCH(...) AGAINST (term IN BOOLEAN MODE) [WITHOUT OR LIKE]
  ↓
MySQL Query Optimizer chooses `products_search_fulltext` ngram index
  ↓
Rows Examined: ~1 candidate row (down from 10,000 in full scan)
  ↓
Decoupled Review Hydration: 1 indexed batch query on 12 IDs (0.29 ms)
  ↓
Search Latency: 13.5 ms – 21.1 ms (Order of magnitude faster)
```

---

## 2. Causal Chain: High-RPS Concurrency Boundary (Whole-Platform)

```text
Sustained 175 RPS Load Generator (k6 on cpuset 2-3)
  ↓
Nginx Gateway (:8193) distributes requests to `app:8000`
  ↓
FrankenPHP Octane with 2 Workers
  ↓
Both workers are continuously active executing PHP request loops
  ↓
Worker CPU reaches ~90% average / ~148% peak of 2 cores
  ↓
Incoming requests wait in Nginx upstream connection buffer (Waiting: 26 connections)
  ↓
p95 Tail Latency rises from 14.6 ms (@ 50 RPS) to 163.8 ms (@ 175 RPS)
  ↓
Database & Redis remain idle (<10% CPU, 0 lock waits)
```

**Conclusion:** The high-load saturation point is purely an application-level worker concurrency limit imposed by the 2-vCPU KVM2 constraint. It is neither a database bottleneck, nor a Redis bottleneck, nor an ingress network failure.
