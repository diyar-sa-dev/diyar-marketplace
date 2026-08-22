# Phase 18.4E — Performance + Security UI Pass

**Status:** Pending (before manual QA)

## Performance

- [ ] N+1 review on relation managers and dashboard widgets
- [ ] Eager loading on heavy list pages
- [ ] Dashboard aggregate queries (no full-table scans)
- [ ] Large table pagination defaults
- [ ] Backend Vite build size / Filament asset review
- [ ] Query log spot-check on Vendor/Provider/User detail tabs

## Security

- [ ] Authorization on every view/edit action (automated tests exist — manual IDOR pass)
- [ ] Sensitive field masking (Users, Payments, Settings, Audit)
- [ ] Error messages do not leak internals
- [ ] Financial invariant checks (refunds, payouts)
- [ ] Production: no default AdminSeeder credentials

## Regression gate (before manual QA)

```bash
cd backend
php artisan test          # 497 tests | 492 passed | 5 skipped | 0 failed
php artisan test --filter=Admin

cd backend && npm run build
cd ../frontend && npm run typecheck && npm run build
```
