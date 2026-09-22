# SQL — catalog search facet path (Phase 19)

**Dataset:** 12 publicly visible products (KVM2 seed).

## q-bearing search (cold, service layer only)

| Scenario | SQL count | Wall ms |
|----------|----------:|--------:|
| q=sofa type=all | 7 | 30.8 |
| q=chair type=all | 7 | 10.2 |
| q=sofa type=products | 6 | 8.9 |

Dominant work: `CatalogSearchService::productFacets()` — vendor GROUP BY, product id pluck (limit 500), color distinct, category distinct + Category fetch; plus product/service list paginator on miss.

## Empty query browse (cold)

| Scenario | SQL count | Wall ms | Payload |
|----------|----------:|--------:|--------:|
| no_q type=all | **19** | **44.7** | **~20 KB** |

Warm: **0 SQL**, **0.88 ms** (cached layers).

## EXPLAIN

Not run individually — query count + decomposition sufficient at this cardinality to classify **no_q cold** as **MySQL-heavy facet aggregation**, **q warm** as **non-MySQL**.

## N+1

`productFacets` uses bounded queries (not classic N+1 on product rows). Vendor lookup is `whereIn` on ≤20 ids.

## Index recommendations

**None issued** — cardinality too small to justify index changes without larger dataset proof (Phase 19 §18).
