# Phase 26.9 — Search Strategy Decision

**Date:** 2026-08-26  
**Decision owner:** Engineering (Stage 26.9)  
**Status:** Approved for phased rollout

---

## Context

| Factor | Current state |
|--------|---------------|
| Catalog size (dev/staging) | Low thousands of products/services |
| Growth expectation | 100K+ products target (Phase 41 load test) |
| Arabic + French + English | Required |
| Infrastructure | MySQL + Redis + Laravel queues (no search cluster today) |
| Existing code | SQL `LIKE` catalog search (Stage 20) |

---

## Options Evaluated

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **A — MySQL FULLTEXT + abstraction** | No new infra; fits current stack; Arabic via ngram/fulltext config | Weaker typo tolerance; facet cost at scale | **Phase 1–2 default** |
| **B — Meilisearch** | Fast typo/facets; good DX; Laravel Scout | New service to operate; Arabic tuning | **Phase 2 optional (flagged)** |
| **C — Typesense** | Similar to Meilisearch | Same ops cost | Deferred |
| **D — OpenSearch/ES** | Maximum scale | High ops complexity for current team size | **Rejected for V1.1** |

---

## Decision

**Adopt a search adapter pattern with MySQL as Phase 1 engine, Meilisearch as optional Phase 2 engine behind feature flags.**

```
SearchQuery
    ↓
SearchEngineInterface
    ├── MysqlCatalogSearchEngine (default)
    └── MeilisearchCatalogSearchEngine (when search_engine_enabled)
    ↓
Fallback: MysqlCatalogSearchEngine + circuit breaker on external engine failure
```

**Authoritative state:** MySQL always. Search index is a **projection**.

---

## Ranking (Phase 1)

Documented formula for MySQL engine:

1. Exact title match (+100)
2. Prefix title match (+80)
3. Token match in title (+40)
4. Description match (+20)
5. Popularity boost (likes/orders normalized, +0–15)
6. Recency decay (published within 30d, +5)

Unified cross-entity rank uses type weights: product 1.0, service 0.9, store 0.85, blog 0.7.

---

## Typo Tolerance

- **Phase 1:** Prefix + token split + `SOUNDEX`/trigram only if MySQL supports without full scan
- **Phase 2 (Meilisearch):** Native typo tolerance when flag enabled

---

## Indexing Pipeline

```
Model saved/deleted
    → Domain event
    → domain_outbox_events (type: search.index.*)
    → ProcessDomainOutboxCommand
    → IndexSearchDocumentJob (queue: search)
    → SearchEngineInterface::upsert/delete
```

Commands:

- `php artisan search:reindex {--entity=} {--chunk=500}`
- `php artisan search:reconcile`
- `php artisan search:health`

---

## Analytics (Phase 1 — parallel track)

Table `search_query_events` — append-only, retention 90d default.

Admin: `GET /admin/search/analytics/summary` (permission: `search.analytics.view`).

---

## Feature Flags

```php
'advanced_search_enabled' => true,      // unified API + UI
'search_engine_enabled' => false,       // external engine
'search_fallback_enabled' => true,      // MySQL fallback on engine failure
'search_analytics_enabled' => true,
```

---

## Performance Targets (to measure, not claim)

| Operation | Target p95 |
|-----------|------------|
| Search | 300ms |
| Suggestions | 100ms |
| Facets | 300ms |
| Admin analytics | 500ms |

Validated via k6 in `scripts/performance/` before COMPLETE verdict.

---

## Backward Compatibility

- `GET /catalog/search` contract preserved; additive fields only
- Legacy `GET /search` deprecated after unified path stable
