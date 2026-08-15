# ADR-001 — Backend Framework

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-08-15 (confirmed 2026-08-15 — Laravel 13 baseline) |

## Problem

Need a backend for multi-vendor marketplace with auth, payments, orders, finance ledger, service marketplace, and admin operations.

## Options

1. Laravel 13 (PHP) — modular monolith
2. Node.js (NestJS)
3. Firebase/Supabase BaaS

## Decision

**Laravel 13 modular monolith**

## Reason

- Product owner confirmed **Laravel 13** as the V1 implementation baseline
- Rich ecosystem for Sanctum, policies, queues (database driver), transactions
- Single deployable suitable for V1 scale
- Matches installed scaffold (`laravel/framework ^13.17`)

## Consequences

- PHP 8.3+ hosting required
- Frontend remains separate React SPA in `frontend/`
- Domain modules must be organized clearly within `backend/app/` to avoid monolith spaghetti
- Sanctum, MySQL, and modular boundaries implemented in Stage 1+

## Historical Note

Earlier Stage 0 drafts referenced Laravel 12 while Composer installed Laravel 13.x. That inconsistency is **resolved** — Laravel 13 is the official baseline. See `conception/Stages/Stage 0/STAGE_0_COMPLETION_REPORT.md`.
