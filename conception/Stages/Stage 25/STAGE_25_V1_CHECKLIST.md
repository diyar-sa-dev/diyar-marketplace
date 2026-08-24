# Stage 25 — V1 Release Checklist

Legend: **PASS** | **PARTIAL** | **FAIL** | Evidence required

## Functional

| Item | Status | Evidence | Risk | Action |
|------|--------|----------|------|--------|
| Authentication | PARTIAL | CSRF JSON + auth timeout fixes committed | low | Verify live `/auth` after Vercel redeploy |
| Roles | PASS | Existing Stage 20 tests | none | — |
| Customer/Vendor/Provider/Admin | PARTIAL | Code unchanged; live smoke pending | low | Post-deploy QA |
| Products/Cart/Checkout/Payment | PARTIAL | Catalog cache + query opts | medium | Cold-start latency on FREE |
| Orders/Returns/Reviews/Services | PASS | Prior stage completion | low | PG smoke deferred |
| Chat/Notifications | PARTIAL | Queue worker optional on FREE | medium | Use sync fallback or paid worker |

## Technical

| Item | Status | Evidence | Risk | Action |
|------|--------|----------|------|--------|
| PostgreSQL prod branch | PARTIAL | SqlDialect, migration fix, CI job | medium | Run full migrate on Render PG |
| Redis | PARTIAL | render.yaml requires Redis | high without Redis | Upstash free tier |
| Vercel config | PARTIAL | env.ts, vercel.json headers | low | Set direct API URL |
| Render config | IMPLEMENTED | render.yaml Docker/Octane | low | Redeploy from main |
| CI/CD | PARTIAL | ci.yml migrate + expanded PG smoke | low | Monitor CI on push |
| Tests (local) | **VERIFIED LOCALLY** | PHPUnit 548/548, Vitest 102/102, build OK | none | CI run on push |
| Database backup | FAIL | FREE tier limitation | **high** | Manual pg_dump procedure |
| No demo in production | PASS | `DIYAR_SEED_ON_BOOT` default false | none | — |
| Performance tests | PARTIAL | performance.yml exists, not PR-gated | low | Document FREE capacity honestly |

## Release gate

**Stage 25 COMPLETE:** NO (infrastructure verification pending)  
**Stage 25 IMPLEMENTED (code):** YES  
**Stage 25 INFRASTRUCTURE-VERIFIED:** NO — requires Render PG + live smoke
