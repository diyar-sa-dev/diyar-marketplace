# Latency Budget — DIYAR Marketplace

**Date:** 2026-08-29

---

## Global targets (Tier B VPS, warm cache)

| Percentile | Public cached read | Public uncached | Authenticated read | Checkout write |
|------------|-------------------|-------------------|-------------------|----------------|
| p50 | <80ms | <150ms | <120ms | <300ms |
| p95 | <200ms | <300ms | <300ms | <500ms |
| p99 | <400ms | <700ms | <600ms | <1500ms |

**Rigor:** Targets are **PROJECTED** until staging k6 confirms. Build/index tests are **VALIDATED**.

---

## Request layer budget (typical catalog GET)

```text
DNS + TLS (CDN)     10–30ms   (edge)     PROJECTED
Nginx               1–5ms     PROVEN (config)
PHP-FPM queue       0–50ms    PROJECTED (load dependent)
Middleware          2–8ms     PROJECTED
  - Correlation ID  <1ms
  - Security headers <1ms
  - Throttle (Redis) 1–3ms
  - Sanctum (if auth) 2–5ms
Controller          1–2ms
Service + DB        20–80ms   VALIDATED (indexed)
  - Cache hit       2–10ms    NOT YET TESTED live
  - Cache miss      30–80ms   VALIDATED indexes
Serialization       3–15ms    PROJECTED (payload size)
Response to client  5–20ms    NETWORK
```

**Total warm p95 target:** <200ms

---

## Endpoint-specific budgets

| Endpoint | p95 budget | Dominant cost | Notes |
|----------|------------|---------------|-------|
| GET /health | 50ms | Minimal | No DB required for liveness |
| GET /products | 200ms | DB or Redis | Page cap prevents deep OFFSET |
| GET /catalog/search | 300ms | DB LIKE + facets | Facets cached 300s |
| GET /products/{id} | 200ms | DB eager load | Single product |
| POST /auth/login | 300ms | bcrypt | Rate limited |
| POST /checkout | 500ms | DB TX + payment redirect | External payment async |
| POST /assistant/chat | 45000ms | OpenAI | connect 10s, total 45s |
| Admin analytics | 800ms | DB aggregates | Consolidated queries |
| FCM push (queue) | 15000ms | Google API | Not user-facing |

---

## External API budgets

| Provider | Connect timeout | Request timeout | Retry | Queue? |
|----------|-----------------|-----------------|-------|--------|
| OpenAI | 10s | 45s | No | No (sync by design) |
| FCM | 5s | 15s | Via job retry | Yes |
| MyFatoorah | SDK default | SDK default | Webhook idempotent | Webhook queued |
| OAuth (FCM token) | 5s | 10s | No | In push job |

---

## Frontend budgets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Main JS gzip | <40 KB | 37.19 KB | VALIDATED |
| LCP (home) | <2.5s | Not measured | NOT YET TESTED |
| INP | <200ms | Not measured | NOT YET TESTED |
| Homepage API calls | <5 ideal | 10+ | MONITOR (OPT-004) |

---

## Failure latency (must be bounded)

| Failure | Max user wait | Behavior |
|---------|---------------|----------|
| Redis down | +50–100ms | Fall through to DB |
| MySQL slow | 30s (PHP max) | 504/timeout |
| OpenAI down | 10s connect + fail | 503 assistant |
| Payment down | 500ms–2s | Controlled checkout error |

---

## Measurement plan

1. Staging k6 smoke: record p50/p95/p99 per endpoint
2. MySQL slow query log: threshold 100ms
3. Optional: Laravel Pulse or structured log sampling

Evidence path: `conception/optimization/_raw/latency-evidence-2026-08-29.txt`
