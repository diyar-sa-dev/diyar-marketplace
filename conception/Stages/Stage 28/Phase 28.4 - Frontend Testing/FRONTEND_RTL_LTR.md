# Phase 28.4 — RTL / LTR Testing

---

## Supported locales

| Locale | Direction | Storage key |
|--------|-----------|-------------|
| **ar** (default) | **RTL** | `diyar-locale` |
| **en** | **LTR** | same |

**French (fr):** **NOT IMPLEMENTED** — not in `SUPPORTED_LOCALES` (`types.ts`).

---

## Implementation

| Mechanism | File |
|-----------|------|
| `localeDirection()` | `lib/i18n/types.ts` |
| `applyDocumentLocale()` | Sets `dir` on document |
| `LocaleProvider` | Context: `{ locale, dir, t }` |
| Auth field direction | `useAuthFieldDirection` for mixed LTR in RTL forms |

---

## Automated evidence

| Test | Result |
|------|--------|
| `translate.test.ts` | ar/en strings PASS |
| `routes.test.tsx` | Loading text in Arabic PASS |
| Playwright | Runs with Arabic UI strings (e.g. projects button `/المشاريع|projects/i`) |

---

## RTL risk areas (source inspection — NOT viewport verified)

| Area | Risk |
|------|------|
| Charts/analytics | Recharts — axis direction **NOT VERIFIED** |
| Modals/dropdowns | Tailwind logical properties mixed with `left/right` in some files |
| Chevrons/navigation | Partial — icon components vary |
| Mixed Arabic/Latin (phone, email) | `SaudiPhoneInput`, `useAuthFieldDirection` |

---

## Gate

| Mode | Result |
|------|--------|
| Arabic RTL (automated partial) | **PARTIAL** |
| English LTR | **PARTIAL** |
| French LTR | **N/A** |

Full RTL visual audit → Phase 28.5.
