# Queue backlog — Phase 19

## Observations

| Metric | Value |
|--------|------:|
| `Queue::size('default')` (spot) | ~31k–43k during baseline window |
| 30s sample delta | **+3125** (40,047 → 43,172) |
| `failed_jobs` | **0** |

## Interpretation

Analytics jobs (Phase 18.3) enqueue on **every q-bearing search**. Under sustained k6 mixed/search load, **enqueue rate exceeds single `queue-default` worker drain rate**, producing a **large Redis backlog**.

**Effects on HTTP path:**

- Each search still performs **synchronous Redis LPUSH** (job dispatch) — not free.
- Redis memory and ops/sec rise; may contribute to tail latency (**MEDIUM** confidence).

**This does not replace Octane worker contention as the primary latency driver** (see concurrent curl probe), but **rejects** the assumption “async analytics = zero system cost.”

## Optimization gate

**No queue architecture change in Phase 19** (no HIGH-confidence single change proven to improve k6 p95 without ops tradeoffs). Phase 20 candidate: **dedicated analytics queue + worker**, or **batch/dedupe analytics**, measured independently.
