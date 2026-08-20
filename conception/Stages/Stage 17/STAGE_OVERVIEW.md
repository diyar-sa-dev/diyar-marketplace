# Stage 17 vs Stage 17.5

## Stage 17 — Chat Domain + Realtime

**Goal:** Deliver functional chat on existing Stage 16 infrastructure.

Includes:
- Conversation / message domain model
- REST APIs + authorization
- Reverb realtime (shared Echo stack)
- Stage 16 notification integration
- React chat UI (real API, no mocks)

## Stage 17.5 — Performance + Scalability + Security + Reliability Hardening

**Goal:** Production-grade foundation without rebuilding chat infrastructure.

Includes:
- Archive lifecycle with verification batches
- Conversation lifecycle states
- Optimistic UX + reconnect reconciliation
- Attachment authorization
- Redis locks + cache strategy
- Typing debounce
- Structured observability events
- Delivery/read semantics (V1)

## Certification status (QA)

| Label | Meaning |
|-------|---------|
| **COMPLETE — Production-grade foundation** | Architecture and code are ready to ship |
| **Pending — High-scale certification** | Load testing + staging archive validation still required |

Do **not** treat Stage 17.5 as “infinite scale proven” until load tests and archive recovery drills are completed in staging.

## Next priorities (post 17.5)

1. Archive verification / recovery drills in staging
2. Real load + latency testing (p50/p95/p99)
3. Observability dashboards from structured chat metrics
4. Optional presence + malware scanning pipeline

See [STAGE_17.5_COMPLETION_REPORT.md](./STAGE_17.5_COMPLETION_REPORT.md) and [QA_ASSESSMENT.md](./QA_ASSESSMENT.md).
