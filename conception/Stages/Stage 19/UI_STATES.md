# Stage 19 — UI State Standard

Every API-driven page should handle:

| State | Component | When |
|-------|-----------|------|
| Loading | `LoadingState`, `TableSkeleton`, `PageLoadingOverlay` | Initial fetch / mutation pending |
| Success | Page content | Data available |
| Empty | `EmptyState` | Zero results (valid response) |
| Error | `ErrorState` | Network / 5xx / parse errors (with retry) |
| Unauthorized | `UnauthorizedState` | 401 / guest on protected view |
| Forbidden | `ForbiddenState` | 403 / wrong role |
| Maintenance | i18n + `EmptyState` | Platform maintenance flag (if enabled) |

`ErrorState` already maps 401/403 messages from `parseApiError`. Dedicated `ForbiddenState` / `UnauthorizedState` wrappers exist for full-page guards.

## Location

```
frontend/src/components/common/
  LoadingState.tsx
  EmptyState.tsx
  ErrorState.tsx
  ForbiddenState.tsx
  UnauthorizedState.tsx
  TableSkeleton.tsx
```

Admin uses parallel primitives under `frontend/src/admin/components/AdminPageSkeleton.tsx`.

## Anti-patterns

- ❌ Mock data fallback when API fails
- ❌ Empty array on error without user feedback
- ❌ Role-only checks without auth context
