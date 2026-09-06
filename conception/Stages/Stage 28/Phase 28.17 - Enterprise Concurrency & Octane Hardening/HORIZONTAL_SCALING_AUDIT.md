# Horizontal Scaling Audit — Phase 28.17

**Date:** 2026-09-03  
**Phase:** 28.17 — Enterprise Concurrency & Octane Hardening  
**Scope:** Multi-instance API, session affinity, load balancer, shared state

---

## What Exists

| Artifact | Description | Status |
|----------|-------------|--------|
| `docker-compose.loadtest.yml` | Single Octane API + Redis + MySQL | **VERIFIED** |
| `deploy/nginx/production.conf.example` | `upstream diyar_api` → single `127.0.0.1:8000` | **VERIFIED** (template) |
| `deploy/nginx/production-like.conf` | FPM upstream example | **VERIFIED** (template) |
| Redis session store | Loadtest `SESSION_DRIVER=redis` | **VERIFIED** |
| Redis cache + queue | Loadtest env | **VERIFIED** |
| k6 mixed workload scripts | `scripts/performance/mixed-workload.js` | **VERIFIED** (prior runs) |

---

## What Is NOT Verified

| Scenario | Requirement | Status |
|----------|-------------|--------|
| Multi-node Octane (2+ API containers) | Shared Redis session, no sticky sessions | **NOT VERIFIED** |
| Load balancer session round-robin | User A login on node 1, request on node 2 → same identity | **NOT VERIFIED** |
| Redis single point of failure / failover | HA Redis | **NOT VERIFIED** |
| MySQL read replicas | Read scaling | **NOT VERIFIED** (out of scope) |
| 278 RPS / 1M req·hour on target tier | Platform claim | **NOT VERIFIED** |
| WebSocket (Reverb) behind LB | Sticky or shared pub/sub | **NOT VERIFIED** |

---

## Shared State Dependencies

```text
                    ┌─────────────┐
  Client ──► LB ──► │ Octane × N  │ (NOT VERIFIED multi-node)
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
           Redis        MySQL       (Reverb)
         session/       primary      NOT in loadtest
         cache/queue
```

All instances must share:
- Redis (session, cache, queue prefix `diyar-loadtest-`)
- MySQL (single primary in loadtest)
- Consistent `APP_KEY` for encryption

---

## Inherited Single-Node Measurements (2026-08-29)

| Profile | Result | Nodes | Status |
|---------|--------|-------|--------|
| ~25 RPS | p95 ~118 ms | 1 (Docker) | **VERIFIED** |
| ~50 RPS | p95 ~825 ms | 1 | **VERIFIED** |

These do not prove horizontal scale-out behavior.

---

## Recommended Tests (pending)

1. Compose override: `api` service `deploy.replicas: 2` + nginx upstream with both backends.
2. k6: login once, hammer `/api/v1/auth/me` through LB without sticky cookie — assert consistent user.
3. Concurrent checkout across nodes on last inventory unit — ties to [CHECKOUT_RACE_CONDITION_AUDIT.md](./CHECKOUT_RACE_CONDITION_AUDIT.md).

---

## Verdict

| Area | Status |
|------|--------|
| Loadtest single-node stack | **VERIFIED** |
| Nginx upstream templates | **VERIFIED** (docs/config) |
| Multi-node runtime proof | **NOT VERIFIED** |
| Production horizontal scaling certified | **NOT VERIFIED** |

**Production Ready:** No.
