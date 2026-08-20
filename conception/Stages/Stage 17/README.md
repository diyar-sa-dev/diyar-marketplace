# Stage 17 — Realtime Chat

## Stage split

| Stage | Focus |
|-------|--------|
| **Stage 17** | Chat domain + realtime on Stage 16 infrastructure |
| **Stage 17.5** | Performance, scalability, security, reliability hardening |

See [STAGE_OVERVIEW.md](./STAGE_OVERVIEW.md) and [QA_ASSESSMENT.md](./QA_ASSESSMENT.md).

Stage 17 delivers production chat on top of the Stage 16/16.5 realtime platform. It does **not** introduce a second WebSocket stack, queue system, or notification pipeline.

## Scope

- Conversations between customer/vendor, customer/provider, and customer/admin
- REST APIs for conversations, messages, read state, typing
- Realtime delivery via Laravel Reverb + Laravel Echo (shared with notifications)
- Stage 16 notification integration for offline recipients
- Redis-backed cache for unread counters and ephemeral typing state
- React chat UI replacing mock data on `/chat`

## Documents

| File | Purpose |
|------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | End-to-end flow and shared infrastructure |
| [CHAT_DOMAIN.md](./CHAT_DOMAIN.md) | Entities, types, authorization |
| [REALTIME.md](./REALTIME.md) | Reverb channels, events, frontend subscriptions |
| [REDIS.md](./REDIS.md) | Cache keys, typing TTL, graceful degradation |
| [QUEUES.md](./QUEUES.md) | Async side effects only |
| [SECURITY.md](./SECURITY.md) | API + WebSocket authorization |
| [API.md](./API.md) | HTTP endpoints |
| [ATTACHMENTS.md](./ATTACHMENTS.md) | Upload flow |
| [TESTING.md](./TESTING.md) | Automated + manual verification |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Reverb, workers, env vars |
| [STAGE_17_COMPLETION_REPORT.md](./STAGE_17_COMPLETION_REPORT.md) | Stage 17 checklist |
| [AUDIT.md](./AUDIT.md) | Stage 17.5 audit summary |
| [PERFORMANCE.md](./PERFORMANCE.md) | Latency + frontend performance |
| [SCALABILITY.md](./SCALABILITY.md) | Horizontal scaling + lifecycle |
| [MESSAGE_RETENTION.md](./MESSAGE_RETENTION.md) | Archive + retention config |
| [STAGE_17.5_COMPLETION_REPORT.md](./STAGE_17.5_COMPLETION_REPORT.md) | Stage 17.5 checklist + certification status |
| [STAGE_OVERVIEW.md](./STAGE_OVERVIEW.md) | Stage 17 vs 17.5 split |
| [QA_ASSESSMENT.md](./QA_ASSESSMENT.md) | QA reviewer matrix |
| [OBSERVABILITY.md](./OBSERVABILITY.md) | Structured metrics |
| [STAGING_DRILL.md](./STAGING_DRILL.md) | Archive validation drill (final 17.5 gate) |
| [CONVERSATION_LIFECYCLE.md](./CONVERSATION_LIFECYCLE.md) | Conversation states |
| [MESSAGE_DELIVERY.md](./MESSAGE_DELIVERY.md) | Sent/delivered/read V1 |

## Key principle

Message persistence is synchronous. Realtime broadcast and notifications run **after commit**.
