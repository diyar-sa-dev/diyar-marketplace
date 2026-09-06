# Platform QA Orchestration

Enterprise verification tiers for DIYAR Marketplace.

## Usage

```powershell
# From repo root
.\scripts\qa\run-platform-certification.ps1 -Tier quick
.\scripts\qa\run-platform-certification.ps1 -Tier integration
.\scripts\qa\run-platform-certification.ps1 -Tier e2e
.\scripts\qa\run-platform-certification.ps1 -Tier security
.\scripts\qa\run-platform-certification.ps1 -Tier load
.\scripts\qa\run-platform-certification.ps1 -Tier certification
```

## Tiers

| Tier | Duration | Includes |
|------|----------|----------|
| **quick** | ~5–10 min | Pint, Vitest, PHPUnit (SQLite) |
| **integration** | +2 min | Redis integration (needs Redis) |
| **e2e** | +10 min | E2E bootstrap + Playwright |
| **security** | +3 min | Rate limit, upload, auth isolation subset |
| **load** | +5 min | k6 mixed rps10 (needs Docker loadtest stack) |
| **certification** | ~30+ min | All above + evidence archive |

## Prerequisites

- **quick:** PHP 8.3, Node 22, Composer, npm
- **integration:** Redis on `127.0.0.1:6379` (or `docker compose -f docker-compose.dev.yml up -d redis`)
- **e2e:** Playwright browsers installed
- **load:** `docker compose -f docker-compose.loadtest.yml up -d` + k6

## Evidence

Certification runs write to:

```text
conception/Stages/Stage 28/Phase 28.16 - Enterprise Platform QA/_raw/{timestamp}/
```

## Related docs

- `conception/Stages/Stage 28/Phase 28.16 - Enterprise Platform QA/FLOW_MATRIX.md`
- `conception/Stages/Stage 28/Phase 28.16 - Enterprise Platform QA/KNOWN_TEST_GAPS.md`
