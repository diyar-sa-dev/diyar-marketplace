# Phase 21 — Environment Certification: KVM2-Equivalent Envelope

**Date:** 2026-09-30  
**Authority:** DIYAR Enterprise Performance & DevOps Engineering  
**Scope:** Controlled resource constraints, process isolation, and stack topology verification  

---

## 1. Resource Allocations & Isolation Constraints

| Component | Container Name | CPU Allocation | Memory Limit | Network / Port | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Reverse Proxy** | `diyar-kvm2-test-nginx-1` | `cpuset: 0-1` | 512 MB | Host `:8193` | HEALTHY |
| **Application Server**| `diyar-kvm2-test-app-1` | `cpuset: 0-1` | 2048 MB | Octane FrankenPHP (2 workers) | HEALTHY |
| **Primary Database** | `diyar-kvm2-test-mysql-1` | `cpuset: 0-1` | 1024 MB | MySQL 8.0 InnoDB + ngram | HEALTHY |
| **Cache & Queues** | `diyar-kvm2-test-redis-1` | `cpuset: 0-1` | 512 MB | Redis 7 protected | HEALTHY |
| **Queue Worker** | `diyar-kvm2-test-queue-worker-1`| `cpuset: 0-1` | 512 MB | Laravel worker daemon | HEALTHY |
| **Load Generator** | `diyar-kvm2-test-k6-run-*` | `cpuset: 2-3` | 1024 MB | k6 execution network | ISOLATED |

---

## 2. Pre-Condition Verification Matrix

```json
{
  "database": "MySQL 8.0 (InnoDB)",
  "products": 12,
  "categories": 20,
  "vendors": 2,
  "failed_jobs": 0,
  "queue_default": 0,
  "queue_analytics": 0
}
```

* **Queue Cleanliness:** Confirmed zero backlog in `queues:default` and `queues:analytics`.
* **Database State:** 0 failed jobs, baseline catalog state active.
* **Worker Pinning:** Load generator strictly restricted to `cpuset 2-3`, preventing benchmark CPU stealing from the application and database cores (`cpuset 0-1`).

---

## 3. Hostinger Production Status
```text
HOSTINGER VPS STATUS: NOT VERIFIED
```
All measurements are recorded strictly inside the local KVM2-equivalent Docker envelope. Hostinger validation is scheduled for post-stage deployment.
