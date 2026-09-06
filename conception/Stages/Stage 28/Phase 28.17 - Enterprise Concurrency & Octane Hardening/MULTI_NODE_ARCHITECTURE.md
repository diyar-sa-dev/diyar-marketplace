# Multi-Node Architecture — Phase 28.17

**Date:** 2026-09-03  
**Scope:** Horizontal scaling preparation for Octane API nodes  
**Status:** **PREPARED** (architecture) — **NOT VERIFIED** (runtime)

---

## Target Topology

```text
                         Load Balancer (nginx)
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
      Octane Node 1         Octane Node 2         Octane Node 3
      (stateless)           (stateless)           (stateless)
           │                     │                     │
           └─────────────────────┼─────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
           Redis              MySQL            Object Storage
    session/cache/queue/      primary           (S3-compatible)
         locks/mutex
              │
         Queue Workers (Supervisor, separate VMs)
         Reverb (1+ instances, Redis pub/sub)
         Scheduler (single effective runner via onOneServer)
```

---

## Stateless Node Requirements

| Requirement | Current state | Status |
|-------------|---------------|--------|
| No local file sessions | `SESSION_DRIVER=redis` in loadtest/production-like | **PREPARED** |
| No local-only cache for shared data | Redis cache store | **PREPARED** |
| No `sync` queue in production | Enforced via env guard | **PREPARED** |
| No node-specific auth state | Octane flush listeners | **VERIFIED** (single node) |
| Shared `APP_KEY` across nodes | Documented requirement | **PREPARED** |
| Consistent Redis prefix | `REDIS_PREFIX` per environment | **PREPARED** |

---

## Session & Auth Across Nodes

**Requirement:** User logs in on Node A; subsequent request routed to Node B must return same identity — **without sticky sessions**.

| Component | Mechanism |
|-----------|-----------|
| Session storage | Redis (`SESSION_DRIVER=redis`, `SESSION_CONNECTION`) |
| Session ID | Cookie-based; encrypted with shared `APP_KEY` |
| Auth guards | Rebuilt per request; Octane flush prevents in-memory bleed |
| Remember-me | DB token; cookie cleared on logout |

**Live proof:** **NOT VERIFIED** — needs 2+ API containers behind nginx round-robin.

---

## Load Balancer

| Artifact | Location |
|----------|----------|
| Production nginx example | `deploy/nginx/production.conf.example` |
| Production-like FPM example | `deploy/nginx/production-like.conf` |

Recommended upstream:

```nginx
upstream diyar_api {
    least_conn;
    server octane-1:8000;
    server octane-2:8000;
    server octane-3:8000;
}
```

Health checks: `/api/v1/health/live` (liveness), `/api/v1/health/ready` (readiness).

---

## Reverb / WebSockets

| Concern | Approach |
|---------|----------|
| Multiple Reverb processes | Redis broadcaster backend |
| WS behind LB | Sticky sessions **or** shared Redis pub/sub (Laravel default with Redis) |
| Channel auth | Separate from HTTP Octane workers |

**Status:** **PREPARED** — not in loadtest compose.

---

## File Storage

| Environment | Storage | Status |
|-------------|---------|--------|
| Development | `local` disk | **Acceptable** |
| Production scale | S3-compatible object storage | **Required** — audit paths in deploy docs |

Production-sensitive paths: user uploads, generated exports, public media — must not rely on local disk per node.

---

## Scheduler & Cron

Only one node should execute each scheduled task per tick:

- `onOneServer()` on all tasks in `routes/console.php` (when shared cache available)
- `withoutOverlapping()` on high-frequency tasks
- Alternative: dedicated scheduler VM running `schedule:run` only

**Status:** **VERIFIED** (code). Multi-node mutex runtime: **NOT VERIFIED**.

---

## Recommended Verification Tests (future gates)

1. **Compose override:** `api` replicas=2 + nginx LB, no sticky cookie
2. **Auth round-robin:** Login → 100× `/auth/me` through LB → consistent user
3. **Checkout split-brain:** Last inventory unit, requests spread across nodes
4. **Webhook replay:** POST same webhook to different nodes → single payment outcome
5. **Scheduler:** Two nodes running scheduler → single execution per minute

---

## Single-Node Evidence (does not prove multi-node)

| Test | Result |
|------|--------|
| Live Octane auth (1 container, 4 workers) | 400/400 pass |
| PHPUnit concurrency | 17+ tests pass |

---

## Verdict

| Area | Status |
|------|--------|
| Architecture design | **PREPARED** |
| Shared Redis/MySQL config | **PREPARED** |
| Multi-node runtime proof | **NOT VERIFIED** |
| Production horizontal scale certified | **NOT VERIFIED** |

See also: [HORIZONTAL_SCALING_AUDIT.md](./HORIZONTAL_SCALING_AUDIT.md).
