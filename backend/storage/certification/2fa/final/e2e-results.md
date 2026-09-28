# Playwright E2E — 2FA

**Spec:** `frontend/e2e/two-factor.spec.ts`  
**Status:** NOT VERIFIED (this cycle)

## Reason

Playwright was not executed against a running frontend dev server pointed at `http://127.0.0.1:8093` during this certification run.

## Recommended command

```powershell
$env:E2E_API_URL = "http://127.0.0.1:8093/api/v1"
cd frontend
npx playwright test e2e/two-factor.spec.ts
```

## Frontend unit coverage (executed)

- `SecurityPage.test.tsx`: 9 passed
- `errors.test.ts`: 10 passed
- TypeScript `tsc --noEmit`: PASS
