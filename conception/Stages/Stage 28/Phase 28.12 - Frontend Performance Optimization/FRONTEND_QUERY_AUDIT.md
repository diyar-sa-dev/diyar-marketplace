# Phase 28.12 — Frontend Query Audit

## Global defaults (`lib/queryClient.ts`)

| Option | Value | Notes |
|--------|------:|-------|
| `staleTime` | 60,000 ms | Unchanged — good default |
| `retry` | 1 | Unchanged |
| `refetchOnWindowFocus` | false | Unchanged |

## Changes this phase

| Hook / query | Before | After | Rationale |
|--------------|--------|-------|-----------|
| `useConversations` | `refetchOnWindowFocus: true` | `false` | Echo + invalidation handle freshness; avoids duplicate list fetch on tab focus |

## Verified unchanged (intentional)

| Hook | Config | Reason |
|------|--------|--------|
| `useVendorAccess` | `staleTime: 0`, 30s poll | Permission freshness for team access |
| `useAdminDetailQuery` | `staleTime: 0` | Admin edit forms need fresh entity |
| `MarketplaceMaintenanceGate` | `staleTime: 0`, 30s poll | Maintenance flag must stay current |
| `useVendor` / `useProvider` | `staleTime: 60s` | Set in Phase 28.11 |
| `useSearchProducts` | `staleTime: 30s` | Set in Phase 28.11 |

## Duplicate request patterns reviewed

| Pattern | Finding |
|---------|---------|
| Catalog facets + product list | Shared query keys via `useCatalog` — OK |
| Chat unread + conversations | Separate keys; focus refetch removed from conversations |
| Admin list + detail | Detail uses `staleTime: 0` by design |
| Homepage sections | Multiple `useProducts` with different filters — acceptable (distinct cache keys) |

## Recommendations deferred (P3)

- OPT-QUERY-001: Prefetch active locale catalog on hover in `LanguageSwitcher` before switch (micro-optimization)
- OPT-QUERY-002: Parallel prefetch of cart + auth on shell mount for logged-in users (measure first)
