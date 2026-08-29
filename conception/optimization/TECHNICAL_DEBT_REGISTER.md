# Technical Debt Register

**Date:** 2026-08-29

---

## Active debt (justified to carry)

| ID | Area | Description | Impact | Trigger to fix | Priority |
|----|------|-------------|--------|----------------|----------|
| TD-001 | Architecture | `CustomerReviewHistoryService` 717 lines | Maintainability | Frequent review-type changes | P3 |
| TD-002 | Config | Dual path: `config()` vs EffectiveConfig | Admin override confusion | Ops reports wrong runtime values | P3 |
| TD-003 | Database | DB-PAG-001 OFFSET pagination | Slow deep pages | >50k SKUs or page-50 p95 >100ms | P2 |
| TD-004 | Frontend | Homepage 10+ API calls | Scale latency | Catalog >10k or home p95 >200ms | P2 |
| TD-005 | Frontend | ServicesSection waterfall | Extra RTT | User complaints on 3G | P3 |
| TD-006 | Security | No CSP header in app | XSS depth defense | Before public launch | P3 |
| TD-007 | Infra | MySQL/Redis not in default CI | Engine parity gap | Before production deploy | P2 |
| TD-008 | Infra | Redis live test skipped | Cache behavior unverified locally | Docker available | P2 |
| TD-009 | Observability | No RUM / Web Vitals | Blind to UX regressions | Post-launch | P3 |
| TD-010 | Product | Public assistant without auth | OpenAI cost risk | Abuse detected | P2 |
| TD-011 | Test | Vitest act() warnings in AuthContext | Noise only | Cleanup sprint | P4 |
| TD-012 | Dev | Windows sodium ext missing | Dev-only warning | Optional local fix | P4 |

---

## Retired / resolved debt

| ID | Resolution | Date |
|----|------------|------|
| TD-R01 | Loyalty EffectiveConfig in tests | 28.15 |
| TD-R02 | B2B XSS admin preview | 28.15 |
| TD-R03 | Auth `/me` navigation spam | OPT-002 |
| TD-R04 | Assistant admin toggle ignored | OPT-003 |
| TD-R05 | E2E ad dismiss regression | 28.15 |
| TD-R06 | VendorOrderQueryFilterTest quote assertion | ENT-001 |
| TD-R07 | Vite app-mockup proxy error | ENT-002 |

---

## Debt acceptance criteria

Debt remains on register when:
- Fix cost > benefit at current scale
- Trigger metric not yet hit
- Product decision pending (e.g. assistant auth)

Remove from register when:
- Fixed with regression test
- Trigger hit and remediated
- Superseded by architecture change

---

## Estimated effort (when triggered)

| ID | Effort | Risk |
|----|--------|------|
| TD-003 Cursor pagination | 3–5 days | Medium — API contract |
| TD-004 Homepage aggregate API | 2–3 days | Low |
| TD-007 CI MySQL/Redis | 0.5 day | Low |
| TD-001 Split review service | 2–4 days | Medium |
| TD-006 CSP nginx | 0.5 day | Low — tuning needed |
