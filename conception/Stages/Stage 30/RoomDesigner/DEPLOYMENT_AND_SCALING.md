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

## Disaster / failure

- DB restore restores designs
- Failed AI jobs: user-visible retry; no charge/quota refund logic V1 — **PREPARED**
- Deploy rollback: flags off instantly; migrations backward compatible (soft delete only)

---

## Nginx / body size

Ensure `client_max_body_size` ≥ try-in-room upload limit (8 MiB) on API vhost — verify existing nginx config at implementation.
