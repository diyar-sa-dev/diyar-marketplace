# Phase 26.8 — Admin Improvements

Enterprise admin control plane: operational dashboard, health center, bulk actions, async exports, audit UX.

**Status:** 🔄 In progress (baseline audit complete)

## Documents

| Doc | Purpose |
|-----|---------|
| [AUDIT.md](./AUDIT.md) | Baseline audit |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Target architecture |
| SECURITY.md | Security model (TBD) |
| PERFORMANCE.md | Query budgets (TBD) |
| API.md | API contracts (TBD) |
| QA.md | Test plan (TBD) |
| COMPLETION_REPORT.md | Final verdict (TBD) |

## Increment 1 (current)

- [x] Baseline audit
- [x] Architecture doc
- [ ] Wire orphaned admin routes + nav
- [ ] Admin health center page + API
- [ ] Permission refinements (`chat.moderate`, `system.health.view`)
- [ ] Feature flags

## Dependencies

- Stage 18 admin foundation
- Stage 26.6 notifications (health probes)
- Stage 26.7 chat moderation
