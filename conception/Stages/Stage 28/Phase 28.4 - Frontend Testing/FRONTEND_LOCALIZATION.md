# Phase 28.4 — Localization Testing

---

## Locales

| Language | Code | Status |
|----------|------|--------|
| Arabic | `ar` | **Implemented** — default |
| English | `en` | **Implemented** |
| French | `fr` | **NOT IMPLEMENTED** |

Locale files: `lib/i18n/locales/ar.ts`, `en.ts` (large nested key trees).

---

## Automated tests

| Test | Result |
|------|--------|
| `translate.test.ts` | 5/5 PASS — key lookup, interpolation |
| Page tests with `LocaleProvider` | B2B, Loyalty, Blog — PASS |

---

## Hardcoded string scan

**Script:** `stage28-i18n-scan.mjs` (heuristic, excludes files using `t()`)

| Metric | Result |
|--------|--------|
| TSX files scanned | 305 |
| Potential hardcoded hits | **0** (heuristic — files with `t()` skipped entirely) |

**Note:** Heuristic under-counts mixed files that use both `t()` and literal strings. Manual spot-check: admin/marketplace pages predominantly use `t()`.

---

## Dynamic formatting

| Type | Implementation |
|------|----------------|
| Dates | `formatOrderDate`, `formatRelativeReviewDate`, `intlLocale.ts` |
| Currency | SAR formatting in checkout/order UI |
| Numbers | Interpolation in translate params |

Vitest: `formatRelativeReviewDate.test.ts` PASS.

---

## API locale header

`Accept-Language` sent on all API requests from stored locale.

---

## Gate

| Area | Result |
|------|--------|
| ar/en | **PASS** (automated + structure) |
| fr | **N/A** |
| Exhaustive untranslated key audit | **NOT VERIFIED** |
