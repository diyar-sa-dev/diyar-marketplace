# Load Testing Plan & Results

## Status

⏳ **Execution pending** — document actual results here after staging archive drill + load tests.

---

## Part A — Archive drill

Complete [STAGING_DRILL.md](./STAGING_DRILL.md) first. Record pass/fail in the table at the bottom of that doc.

---

## Part B — Load testing

### Scenarios

| Scenario | Concurrent users | Duration |
|----------|------------------|----------|
| Baseline | 100 | 10 min |
| Growth | 500 | 10 min |
| Stress | 1,000 | 10 min |

### Actions per virtual user

- Open conversation list
- Send message every 5–15s (random)
- Subscribe to Reverb channel
- Occasional mark-read

### Metrics to capture

| Metric | p50 | p95 | p99 | Tool |
|--------|-----|-----|-----|------|
| HTTP POST /messages → response | | | | k6/Artillery |
| DB persistence (`persistence_ms` log) | | | | Laravel log / APM |
| Broadcast dispatch (`broadcast_ms` log) | | | | Laravel log / APM |
| End-to-end recipient UI | | | | Manual / RUM |
| Queue job latency (notifications) | | | | Horizon / Redis |
| Redis command latency | | | | Redis INFO |
| MySQL slow queries | | | | slow log |
| Reverb connections | | | | Reverb dashboard |
| Worker CPU/RAM | | | | host metrics |

### Full path under test

```text
Client
  ↓ POST /messages
DB transaction
  ↓ afterCommit
MessageCreated event
  ↓
Reverb broadcast
  ↓
Echo → recipient UI
```

### Results (fill after run)

**Environment:** staging / date / commit

#### 100 users

| Metric | p50 | p95 | p99 |
|--------|-----|-----|-----|
| HTTP persistence | | | |
| Broadcast | | | |
| E2E delivery | | | |

#### 500 users

| Metric | p50 | p95 | p99 |
|--------|-----|-----|-----|
| HTTP persistence | | | |
| Broadcast | | | |
| E2E delivery | | | |

#### 1000 users

| Metric | p50 | p95 | p99 |
|--------|-----|-----|-----|
| HTTP persistence | | | |
| Broadcast | | | |
| E2E delivery | | | |

### Observations

_Document bottlenecks, errors, connection drops, queue backlog._

### Certification decision

- [ ] High-scale production certified
- [ ] Needs tuning (list items)
- [ ] Blocked (list items)
