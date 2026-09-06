# Stage 26.3 — Loyalty Performance

## Query patterns

| Endpoint | Pattern |
|----------|---------|
| `GET /loyalty` | Single account lookup by authenticated `user_id` (unique index) |
| `GET /loyalty/transactions` | Paginated ledger query scoped to account; optional `type` filter |
| Admin customer loyalty | Account + last 10 transactions (limited, no full ledger load) |

## Indexes (migration)

Existing indexes match query paths:

- `loyalty_accounts.user_id` (unique)
- `loyalty_transactions.loyalty_account_id`
- `loyalty_transactions.type`
- `loyalty_transactions.created_at`
- `loyalty_transactions.reference` (unique, idempotency)

## N+1 avoidance

- Transaction pagination uses a single paginator query with account scoping.
- Admin recent transactions use `limit(10)` without loading full history.
- Listeners load only required order/return relations.

## Caching

- Loyalty settings read through `EffectiveConfigService` (platform settings cache).
- Balances are **not** cached across mutations; DB remains authoritative.
- Customer/admin React Query keys are user-scoped.

## Scalability notes

- Ledger is append-only; reads are paginated (max 50 per page on customer API).
- Architecture supports growth to large user counts without redesign.
- No in-memory full-ledger loads.

## Not measured locally

Staging p95/p99 latency for loyalty endpoints — **DEFERRED** (infrastructure-dependent).
