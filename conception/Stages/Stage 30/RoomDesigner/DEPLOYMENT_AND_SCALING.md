# Deployment and Scaling

**Parent:** [`STAGE_30_ROOM_DESIGNER_MASTER.md`](STAGE_30_ROOM_DESIGNER_MASTER.md)

---

## V1 deployment (KVM2)

```text
Browser → Nginx → Octane/FPM → MySQL
                    ↓
                  Redis → queue workers
                    ↓
              external AI API (Try-in-Room only)
```

**No new containers** for Room Designer V1.

Existing compose services: **VERIFIED** in project docker-compose production variants.

---

## Rollout

1. Deploy code with all flags **false**
2. Enable `room_designer_enabled` for staff/beta (optional env allowlist — **PREPARED**)
3. Monitor save latency + error rates
4. Enable Try-in-Room separately after provider vetted

---

## Feature flags

Env keys (proposal):

```text
DIYAR_FEATURE_ROOM_DESIGNER_ENABLED=false
DIYAR_FEATURE_TRY_IN_ROOM_ENABLED=false
DIYAR_FEATURE_AI_VISUALIZATION_ENABLED=false
DIYAR_FEATURE_ROOM_DESIGNER_3D_ENABLED=false
DIYAR_FEATURE_ROOM_DESIGNER_SHARING_ENABLED=false
```

---

## Scaling path

| Stage | Trigger | Action |
|-------|---------|--------|
| A KVM2 | default | single node |
| B Larger VPS | p95 SLO breach sustained | more CPU/RAM, workers |
| C Split workers | queue backlog | dedicated queue container |
| D Horizontal | multi-node evidence | LB + sticky sessions or stateless API |
| E AI infra | cost/latency | dedicated workers / GPU provider |

Same codebase; no microservice split without approval.

---

## Stage 30.18 — Evidence-driven triggers (2026-09-20)

**Status:** VERIFIED WITH LIMITATIONS — documentation update only; **production traffic triggers NOT VERIFIED**.

| Signal | Measured locally (KVM2-equivalent) | Stage B–E trigger (proposal) |
|--------|----------------------------------|------------------------------|
| API p95 under burst | See `backend/storage/certification/kvm2-equivalent/DIYAR_LOCAL_KVM2_EQUIVALENT_VALIDATION_REPORT.md` | Sustained p95 > SLO for 24h → Stage B |
| Queue backlog | **NOT VERIFIED** in production | depth > threshold 15m → Stage C |
| Room design PUT rate | **NOT VERIFIED** | autosave storm → throttle tuning before scale |
| Try-in-Room / AI jobs | Stub/null default | cost/latency SLO breach → Stage E |

**Rule:** Do not advance to Stage B–E without measured production metrics; local KVM2-equivalent is planning evidence only.

---

## Disaster / failure

- DB restore restores designs
- Failed AI jobs: user-visible retry; no charge/quota refund logic V1 — **PREPARED**
- Deploy rollback: flags off instantly; migrations backward compatible (soft delete only)

---

## Nginx / body size

Ensure `client_max_body_size` ≥ try-in-room upload limit (8 MiB) on API vhost — verify existing nginx config at implementation.
