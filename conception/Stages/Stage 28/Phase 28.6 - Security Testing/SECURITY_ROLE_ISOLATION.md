# Phase 28.6 — Security Role Isolation

---

## Horizontal escalation (tested)

| From | To | Result |
|------|-----|--------|
| Customer A | Customer B cart/orders | **Denied** |
| Vendor A | Vendor B products/accounts | **Denied** |
| Provider A | Provider B accounts | **Denied** |
| Customer | Vendor account API | **403** |
| Customer | Admin B2B API | **401/403** |

---

## Vertical escalation (tested)

| From | To | Result |
|------|-----|--------|
| Customer | Admin routes | **401/403** |
| Vendor | Admin routes | **403** |
| Admin (marketplace API) | Vendor account | **403** |
| Admin without permission | Settings/payouts | **403** AdminSecurityHardeningTest |

---

## Role assignment via user input

| Vector | Control |
|--------|---------|
| `UpdateProfileRequest` | `status` **prohibited** |
| Registration | Role assigned server-side |
| Admin role sync | Admin-only API |

---

## E2E (28.5)

Auth isolation: marketplace logout preserves admin and vice versa — **PASS**.

---

## Gate

```text
PASS
```

No vertical escalation observed in executed tests.
