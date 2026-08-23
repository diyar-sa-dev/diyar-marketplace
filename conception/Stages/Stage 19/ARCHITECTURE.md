# Stage 19 — Architecture

## Control planes

```text
                    DIYAR
                      │
          ┌───────────┴───────────┐
          │                       │
    MARKETPLACE               ADMIN OPS
          │                       │
 MarketplaceAuth             AdminAuth
          │                       │
 marketplaceApi              adminApi
          │                       │
 /api/v1/*                   /api/v1/admin/*
```

Stage 19 applies only to the **Marketplace** SPA (`frontend/src/` excluding `admin/`).

## Data flow

1. **Server authority** — prices, stock, commissions, balances, statuses computed in Laravel services.
2. **Typed resources** — frontend types mirror API resources; no duplicated business rules.
3. **React Query** — domain-scoped keys (`cartKeys`, `productKeys`, `wishlistKeys`, etc.).
4. **UI primitives** — `LoadingState`, `EmptyState`, `ErrorState`, `ForbiddenState`, `UnauthorizedState`.

## Route guards

See [ROUTE_GUARDS.md](./ROUTE_GUARDS.md).

## Related docs

- [API_MIGRATION.md](./API_MIGRATION.md)
- [ROUTE_GUARDS.md](./ROUTE_GUARDS.md)
- [UI_STATES.md](./UI_STATES.md)
- [COMPLETION_REPORT.md](./COMPLETION_REPORT.md)
