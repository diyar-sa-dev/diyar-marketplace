# ADR-002 — Database

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-08-15 |

## Problem

Select primary database for V1.

## Options

1. MySQL 8
2. PostgreSQL
3. MySQL now, PostgreSQL later without plan

## Decision

**MySQL now, PostgreSQL later without plan**

## Reason

- Product owner QCM explicitly selected MySQL for V1
- Sufficient for marketplace relational model
- Laravel first-class support

## Consequences

- JSON columns used for flexible attributes (materials, settings)
- PostgreSQL migration only if future operational need documented
- Prior discovery doc (PostgreSQL) superseded

## Future

Re-evaluate PostgreSQL if: advanced JSON querying, pgvector for image search at scale, or ops team standardization requires it.
