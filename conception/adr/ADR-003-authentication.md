# ADR-003 — Authentication

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-08-15 |

## Problem

Replace mock localStorage auth with production authentication.

## Options

1. Laravel Sanctum (SPA + API tokens)
2. Laravel Passport (OAuth2)
3. Auth0 / Firebase Auth

## Decision

**Laravel Sanctum For now, OAUTH Social for later**

## Reason

- First-party SPA + future mobile tokens
- Simpler than Passport for this use case
- No external auth dependency cost in V1
- Supports phone/email login custom flows + OTP

## Consequences

- Custom OTP service required (SMS provider)
- CORS and cookie domain configuration for SPA
- Social login deferred but User model remains compatible

## Rules

- Phone mandatory at registration
- Admin only via seeder
- Password policy enforced centrally
