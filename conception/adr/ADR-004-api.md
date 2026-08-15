# ADR-004 — API Style

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-08-15 |

## Problem

Define API contract between React SPA and Laravel backend.

## Options

1. REST JSON `/api/v1`
2. GraphQL
3. tRPC

## Decision

**REST JSON with `/api/v1` prefix**

## Reason

- Matches existing frontend fetch patterns to be introduced
- Laravel excels at REST + Form Requests + API Resources
- OpenAPI documentation straightforward
- Mobile app can share same API

## Consequences

- Some pages need aggregated endpoints (`/home`, `/checkout/preview`)
- Version prefix required from day one
- Breaking changes → `/api/v2` later

## Standards

- Laravel API Resources for serialization
- Consistent error format (422 validation)
- Pagination, filtering conventions documented in API_SPECIFICATION.md
