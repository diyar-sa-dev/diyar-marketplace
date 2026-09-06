# API Performance Review

## Hot endpoints

| Endpoint | Query pattern | Status |
|----------|---------------|--------|
| GET /products | Indexed + cached catalog | OK |
| GET /products/{id} | Eager load controlled | OK |
| POST /checkout/preview | Multi-vendor shipping calc | Monitor at scale |
| POST /payments/webhook | Idempotent + queued | OK |
| GET /admin/analytics/* | Consolidated aggregates (OPT-API-002) | Fixed |
| POST /assistant/chat | External OpenAI 45s timeout | Rate limited |

## Payload

API Resources used consistently. No evidence of runaway nested relations in catalog public API.

## Pagination

Orders/notifications paginated. Category tree unbounded but low cardinality.
